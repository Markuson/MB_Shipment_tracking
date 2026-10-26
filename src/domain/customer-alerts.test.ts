import { describe, expect, it } from 'vitest';
import { deriveCustomerAlerts } from './customer-alerts';
import type { NormalisationSources } from './normalise';
import type { Leg, OperatorEvent, Shipment } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-1': { SALIDA: 'in-transit', RETRASO: 'delayed', RETENIDO: 'held' } },
  guessWithAi: () => ({ code: 'delayed', score: 0.3 }),
};

const now = '2026-11-14T12:00:00Z';

function event(legId: string, rawText: string, reportedAt: string): OperatorEvent {
  return { legId, rawText, reportedAt, operatorId: 'op-1' };
}

function leg(id: string, type: Leg['type'], events: OperatorEvent[], end = '2026-11-15T18:00:00Z'): Leg {
  return { id, type, order: 1, operatorId: 'op-1', planned: { start: '2026-11-14T00:00:00Z', end }, events };
}

function shipmentWith(singleLeg: Leg): Shipment {
  return { id: 'shp-1', accountId: 'acc-1', originSiteId: 'site-1', destination: { city: 'Lyon', country: 'FR' }, legs: [singleLeg] };
}

describe('deriveCustomerAlerts', () => {
  it('tells the customer about a delay the carrier reported, with the fact it rests on', () => {
    const shipment = shipmentWith(leg('road', 'road', [event('road', 'RETRASO', '2026-11-14T09:00:00Z')]));

    const alerts = deriveCustomerAlerts(shipment, now, sources);

    expect(alerts).toEqual([{
      shipmentId: 'shp-1',
      legType: 'road',
      cause: 'delay',
      basis: 'reported',
      fact: { phrase: 'Delayed', reportedAt: '2026-11-14T09:00:00Z', operatorId: 'op-1' },
      plannedEnd: '2026-11-15T18:00:00Z',
    }]);
  });

  it('tells the customer about a customs hold', () => {
    const shipment = shipmentWith(leg('customs', 'customs', [event('customs', 'RETENIDO', '2026-11-14T09:00:00Z')]));

    const alerts = deriveCustomerAlerts(shipment, now, sources);

    expect(alerts).toMatchObject([{ cause: 'customs-hold', basis: 'reported' }]);
  });

  it('marks a leg past its planned end as behind plan, not as a reported delay', () => {
    const lateLeg = leg('road', 'road', [event('road', 'SALIDA', '2026-11-14T01:00:00Z')], '2026-11-14T08:00:00Z');

    const alerts = deriveCustomerAlerts(shipmentWith(lateLeg), now, sources);

    expect(alerts).toMatchObject([{ cause: 'delay', basis: 'behind-plan', fact: { phrase: 'In transit' } }]);
  });

  it('keeps a silent operator internal', () => {
    const silentLeg = leg('road', 'road', []);

    const alerts = deriveCustomerAlerts(shipmentWith(silentLeg), '2026-11-14T20:00:00Z', sources);

    expect(alerts).toEqual([]);
  });

  it('keeps a status under review internal, even when the guess is a delay', () => {
    const shipment = shipmentWith(leg('road', 'road', [event('road', 'PARADA', '2026-11-14T09:00:00Z')]));

    const alerts = deriveCustomerAlerts(shipment, now, sources);

    expect(alerts).toEqual([]);
  });
});
