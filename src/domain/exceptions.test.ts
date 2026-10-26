import { describe, expect, it } from 'vitest';
import { deriveExceptions, rankExceptions, type ShipmentException } from './exceptions';
import type { NormalisationSources } from './normalise';
import type { Leg, Shipment } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-lastmile': { 'INCIDENCIA ENTREGA': 'delivery-exception' } },
  guessWithAi: () => ({ code: 'in-transit', score: 0.9 }),
};

function shipmentWith(leg: Leg): Shipment {
  return { id: 'shp-1', accountId: 'acc-rhone', originSiteId: 'site-valencia', destination: { city: 'Lyon', country: 'FR' }, legs: [leg] };
}

// Road legs go stale after 8h without data.
const silentRoadLeg: Leg = {
  id: 'leg-road',
  type: 'road',
  order: 1,
  operatorId: 'op-rutasur',
  planned: { start: '2026-11-12T08:00:00Z', end: '2026-11-13T08:00:00Z' },
  events: [],
};

describe('deriveExceptions', () => {
  it('raises no exception for a silent leg before its stale threshold', () => {
    const exceptions = deriveExceptions(shipmentWith(silentRoadLeg), '2026-11-12T15:00:00Z', sources);

    expect(exceptions).toEqual([]);
  });

  it('raises a silent-operator exception once a silent leg is past its stale threshold', () => {
    const exceptions = deriveExceptions(shipmentWith(silentRoadLeg), '2026-11-12T17:00:00Z', sources);

    expect(exceptions).toEqual([{
      shipmentId: 'shp-1',
      legId: 'leg-road',
      cause: 'silent-operator',
      severity: 'critical',
      basis: 'silence',
      since: '2026-11-12T08:00:00Z',
    }]);
  });

  it('raises silent-operator only on a silent first leg, not on the legs waiting behind it', () => {
    const silentLastMileLeg: Leg = {
      id: 'leg-last-mile',
      type: 'last-mile',
      order: 2,
      operatorId: 'op-lastmile',
      planned: { start: '2026-11-12T10:00:00Z', end: '2026-11-12T18:00:00Z' },
      events: [],
    };
    const shipment = { ...shipmentWith(silentRoadLeg), legs: [silentRoadLeg, silentLastMileLeg] };

    const exceptions = deriveExceptions(shipment, '2026-11-12T17:00:00Z', sources);

    expect(exceptions).toMatchObject([{ legId: 'leg-road', cause: 'silent-operator' }]);
  });

  it('raises a delay exception for a last-mile delivery exception', () => {
    const lastMileLeg: Leg = {
      id: 'leg-last-mile',
      type: 'last-mile',
      order: 1,
      operatorId: 'op-lastmile',
      planned: { start: '2026-11-15T08:00:00Z', end: '2026-11-15T18:00:00Z' },
      events: [{ legId: 'leg-last-mile', rawText: 'INCIDENCIA ENTREGA', reportedAt: '2026-11-15T11:00:00Z', operatorId: 'op-lastmile' }],
    };

    const exceptions = deriveExceptions(shipmentWith(lastMileLeg), '2026-11-15T12:00:00Z', sources);

    expect(exceptions).toEqual([{
      shipmentId: 'shp-1',
      legId: 'leg-last-mile',
      cause: 'delay',
      severity: 'caution',
      basis: 'reported',
      since: '2026-11-15T11:00:00Z',
    }]);
  });

  it('raises a needs-review exception when the latest event is a low-confidence guess', () => {
    const lowConfidenceSources: NormalisationSources = { ...sources, guessWithAi: () => ({ code: 'delayed', score: 0.2 }) };
    const ambiguousRoadLeg: Leg = {
      ...silentRoadLeg,
      events: [{ legId: 'leg-road', rawText: 'PARADA TÉCNICA', reportedAt: '2026-11-12T10:00:00Z', operatorId: 'op-rutasur' }],
    };

    const exceptions = deriveExceptions(shipmentWith(ambiguousRoadLeg), '2026-11-12T12:00:00Z', lowConfidenceSources);

    expect(exceptions).toEqual([{
      shipmentId: 'shp-1',
      legId: 'leg-road',
      cause: 'needs-review',
      severity: 'caution',
      basis: 'reported',
      since: '2026-11-12T10:00:00Z',
    }]);
  });
});

describe('rankExceptions', () => {
  it('puts critical before caution and the oldest first within the same severity', () => {
    const exceptions: ShipmentException[] = [
      { shipmentId: 'shp-1', legId: 'caution-old', cause: 'delay', severity: 'caution', basis: 'reported', since: '2026-11-10T08:00:00Z' },
      { shipmentId: 'shp-2', legId: 'critical-new', cause: 'customs-hold', severity: 'critical', basis: 'reported', since: '2026-11-13T08:00:00Z' },
      { shipmentId: 'shp-3', legId: 'critical-old', cause: 'silent-operator', severity: 'critical', basis: 'silence', since: '2026-11-11T08:00:00Z' },
    ];

    const ranked = rankExceptions(exceptions);

    expect(ranked.map(exception => exception.legId)).toEqual(['critical-old', 'critical-new', 'caution-old']);
  });
});
