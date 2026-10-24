import { describe, expect, it } from 'vitest';
import { normalise, type NormalisationSources } from './normalise';
import type { OperatorEvent } from './shipment';

const event: OperatorEvent = {
  legId: 'leg-1',
  rawText: 'ENTREGADO OK',
  reportedAt: '2026-11-14T09:10:00Z',
  operatorId: 'op-rutasur',
};

describe('normalise', () => {
  it('applies an ops correction before the rule table', () => {
    const sources: NormalisationSources = {
      corrections: [{
        type: 'status-correction',
        operatorId: 'op-rutasur',
        rawText: 'ENTREGADO OK',
        status: { code: 'in-transit', method: 'correction', needsReview: false },
        correctedBy: 'ops-user',
        at: '2026-11-14T10:00:00Z',
      }],
      ruleTable: { 'op-rutasur': { 'ENTREGADO OK': 'arrived' } },
      guessWithAi: () => ({ code: 'delayed', score: 0.9 }),
    };

    const status = normalise(event, sources);

    expect(status).toEqual({ code: 'in-transit', method: 'correction', needsReview: false });
  });

  it('applies the rule table before the AI fallback', () => {
    const sources: NormalisationSources = {
      corrections: [],
      ruleTable: { 'op-rutasur': { 'ENTREGADO OK': 'arrived' } },
      guessWithAi: () => ({ code: 'delayed', score: 0.9 }),
    };

    const status = normalise(event, sources);

    expect(status).toEqual({ code: 'arrived', method: 'rule', needsReview: false });
  });

  it('ignores a correction for the same wording from another operator', () => {
    const sources: NormalisationSources = {
      corrections: [{
        type: 'status-correction',
        operatorId: 'op-other',
        rawText: 'ENTREGADO OK',
        status: { code: 'in-transit', method: 'correction', needsReview: false },
        correctedBy: 'ops-user',
        at: '2026-11-14T10:00:00Z',
      }],
      ruleTable: {},
      guessWithAi: () => ({ code: 'arrived', score: 0.6 }),
    };

    const status = normalise(event, sources);

    expect(status).toEqual({ code: 'arrived', method: 'ai', confidence: 'low', needsReview: true });
  });
});
