import { describe, expect, it } from 'vitest';
import { deriveLegStatus } from './leg-status';
import type { NormalisationSources } from './normalise';
import type { Leg } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-rutasur': { SALIDA: 'in-transit' } },
  guessWithAi: () => ({ code: 'in-transit', score: 0.9 }),
};

const silentLeg: Leg = {
  id: 'leg-1',
  type: 'road',
  order: 1,
  operatorId: 'op-rutasur',
  planned: { start: '2026-11-12T08:00:00Z', end: '2026-11-13T08:00:00Z' },
  events: [],
};

describe('deriveLegStatus', () => {
  it('confirms a leg from its latest event', () => {
    const leg: Leg = {
      ...silentLeg,
      events: [{ legId: 'leg-1', rawText: 'SALIDA', reportedAt: '2026-11-12T09:00:00Z', operatorId: 'op-rutasur' }],
    };

    const status = deriveLegStatus(leg, '2026-11-12T10:00:00Z', sources);

    expect(status).toEqual({
      kind: 'confirmed',
      value: { code: 'in-transit', method: 'rule', needsReview: false },
      reportedAt: '2026-11-12T09:00:00Z',
      source: 'op-rutasur',
    });
  });

  it('marks a silent leg unknown without a since date before its planned start', () => {
    const status = deriveLegStatus(silentLeg, '2026-11-12T07:00:00Z', sources);

    expect(status).toEqual({ kind: 'unknown' });
  });

  it('marks a silent leg unknown since its planned start once it is due', () => {
    const status = deriveLegStatus(silentLeg, '2026-11-12T20:00:00Z', sources);

    expect(status).toEqual({ kind: 'unknown', since: '2026-11-12T08:00:00Z' });
  });
});
