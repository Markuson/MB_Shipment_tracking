import { describe, expect, it } from 'vitest';
import { deriveDeliveryOutlook } from '@/domain/delivery-outlook';
import { estimateDelivery } from '@/domain/eta';
import { deriveExceptions, rankExceptions } from '@/domain/exceptions';
import { deriveLegStatus, isReliable } from '@/domain/leg-status';
import { deriveLegView } from '@/domain/leg-view';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Shipment } from '@/domain/shipment';
import { demoScenarios } from './demo-scenarios';
import { mockNormalisationSources } from './normalisation';
import { routeHistory } from './route-history';
import { demoStartTime } from './demo-clock';
import { mockShipments } from './shipments';

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function daysAfterDemoStart(days: number) {
  return new Date(Date.parse(demoStartTime) + days * millisecondsPerDay).toISOString();
}

function findMockShipment(shipmentId: string) {
  const shipment = mockShipments.find(candidate => candidate.id === shipmentId);
  if (!shipment) throw new Error(`Mock shipment ${shipmentId} is missing`);
  return shipment;
}

function withPortDelayReported(shipment: Shipment) {
  const portDelay = demoScenarios.find(scenario => scenario.id === 'port-delay');
  if (!portDelay) throw new Error('The port delay scenario is missing');
  return withOperatorEvents(shipment, [{ ...portDelay.report, reportedAt: demoStartTime }]);
}

describe('mock shipments at the demo start', () => {
  it('raise exactly the exception each challenge case is written to show', () => {
    const causesByShipment = Object.fromEntries(mockShipments.map(shipment => [
      shipment.id,
      deriveExceptions(shipment, demoStartTime, mockNormalisationSources).map(exception => exception.cause),
    ]));

    expect(causesByShipment).toEqual({
      'shp-1001': [],
      'shp-1002': [],
      'shp-1003': ['customs-hold'],
      'shp-1004': ['silent-operator'],
      'shp-1005': ['needs-review'],
      'shp-1006': [],
    });
  });

  it('leave the ambiguous road update of case 5 for review instead of showing it as a fact', () => {
    const ambiguousLeg = mockShipments.find(shipment => shipment.id === 'shp-1005')?.legs.at(0);
    if (!ambiguousLeg) throw new Error('Case 5 has no road leg');

    const status = deriveLegStatus(ambiguousLeg, demoStartTime, mockNormalisationSources);

    expect(status).toMatchObject({ kind: 'confirmed', value: { method: 'ai', confidence: 'low' } });
    expect(isReliable(status)).toBe(false);
  });

  it('raise a delay on the hero vessel once the port delay is reported, and show it to its customer', () => {
    const hero = mockShipments.find(shipment => shipment.id === 'shp-1002');
    if (!hero) throw new Error('The hero shipment is missing');

    const reported = withPortDelayReported(hero);
    const seaLeg = reported.legs.find(leg => leg.id === 'shp-1002-sea');
    if (!seaLeg) throw new Error('The hero has no sea leg');

    expect(deriveExceptions(reported, demoStartTime, mockNormalisationSources)).toMatchObject([
      { legId: 'shp-1002-sea', cause: 'delay' },
    ]);
    const isNextToReport = true;
    expect(deriveLegView(seaLeg, demoStartTime, mockNormalisationSources, 'customer', isNextToReport).state)
      .toMatchObject({ kind: 'confirmed', fact: { phrase: 'Delayed' } });
  });

  it('rank critical exceptions oldest first, then cautions oldest first, once the port delay is reported', () => {
    const exceptions = mockShipments.map(withPortDelayReported).flatMap(
      shipment => deriveExceptions(shipment, demoStartTime, mockNormalisationSources),
    );

    const ranked = rankExceptions(exceptions);

    expect(ranked.map(exception => exception.shipmentId)).toEqual(['shp-1003', 'shp-1004', 'shp-1005', 'shp-1002']);
  });

  it('keep the customs hold as the only exception of SHP-1003 a day later, with its last mile still waiting', () => {
    const exceptions = deriveExceptions(findMockShipment('shp-1003'), daysAfterDemoStart(1), mockNormalisationSources);

    expect(exceptions.map(exception => exception.cause)).toEqual(['customs-hold']);
  });

  it.each([1, 2])('keep the silent road leg as the only exception of SHP-1004 %i day(s) later', (days) => {
    const exceptions = deriveExceptions(findMockShipment('shp-1004'), daysAfterDemoStart(days), mockNormalisationSources);

    expect(exceptions).toMatchObject([{ legId: 'shp-1004-road', cause: 'silent-operator' }]);
  });

  it('estimate only where route history covers the situation, and never while customs hold or a status needs review', () => {
    const etaKinds = Object.fromEntries(mockShipments.map(shipment => [
      shipment.id,
      estimateDelivery(shipment, demoStartTime, mockNormalisationSources, routeHistory).kind,
    ]));

    expect(etaKinds).toEqual({
      'shp-1001': 'estimated',
      'shp-1002': 'estimated',
      'shp-1003': 'unknown',
      'shp-1004': 'unknown',
      'shp-1005': 'unknown',
      'shp-1006': 'confirmed',
    });
  });

  it('show the hero on time at the start, and a possible delay once the port delay is reported', () => {
    const hero = findMockShipment('shp-1002');
    const promised = '2026-11-16T18:00:00Z';
    const outlookOf = (shipment: Shipment) => {
      const eta = estimateDelivery(shipment, demoStartTime, mockNormalisationSources, routeHistory);
      return deriveDeliveryOutlook({ eta, promised, delivered: eta.kind === 'confirmed' });
    };

    expect(outlookOf(hero)).toBe('on-time');
    expect(outlookOf(withPortDelayReported(hero))).toBe('possible-delay');
  });
});
