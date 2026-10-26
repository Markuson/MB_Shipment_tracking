import { describe, expect, it } from 'vitest';
import { deriveCustomerSummary } from './customer-summary';
import type { RouteHistory } from './eta';
import type { NormalisationSources } from './normalise';
import type { Leg, OperatorEvent, Shipment } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-1': { SALIDA: 'in-transit', RETRASO: 'delayed', RETENIDO: 'held' } },
  guessWithAi: () => ({ code: 'unrecognised', score: 0 }),
};

const history: RouteHistory = {
  'site-1>Lyon': { onSchedule: { earliestHours: -2, latestHours: 0, confidence: 'high', reason: 'On time here.' } },
};

const now = '2026-11-14T12:00:00Z';

function event(legId: string, rawText: string): OperatorEvent {
  return { legId, rawText, reportedAt: '2026-11-14T09:00:00Z', operatorId: 'op-1' };
}

function shipmentWith(type: Leg['type'], events: OperatorEvent[]): Shipment {
  const singleLeg: Leg = {
    id: 'leg', type, order: 1, operatorId: 'op-1',
    planned: { start: '2026-11-14T00:00:00Z', end: '2026-11-15T18:00:00Z' },
    events,
  };
  return { id: 'shp-1', accountId: 'acc-1', originSiteId: 'site-1', destination: { city: 'Lyon', country: 'FR' }, legs: [singleLeg] };
}

describe('deriveCustomerSummary', () => {
  it('names the customs hold as the reason there is no delivery date', () => {
    const summary = deriveCustomerSummary(shipmentWith('customs', [event('leg', 'RETENIDO')]), now, sources, history);

    expect(summary).toMatchObject({ eta: { kind: 'unknown' }, outlook: 'awaiting-details', blocker: 'held-by-customs' });
  });

  it('names no blocker when an estimate exists', () => {
    const summary = deriveCustomerSummary(shipmentWith('road', [event('leg', 'SALIDA')]), now, sources, history);

    expect(summary).toMatchObject({ eta: { kind: 'estimated' }, outlook: 'on-time' });
    expect(summary.blocker).toBeUndefined();
  });

  it('names a reported delay when route history has nothing for it', () => {
    const summary = deriveCustomerSummary(shipmentWith('road', [event('leg', 'RETRASO')]), now, sources, history);

    expect(summary).toMatchObject({ eta: { kind: 'unknown' }, blocker: 'delayed' });
  });
});
