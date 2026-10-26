import { describe, expect, it } from 'vitest';
import { deriveLegView } from './leg-view';
import type { NormalisationSources } from './normalise';
import type { Leg, OperatorEvent } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-rutasur': { SALIDA: 'in-transit', LLEGADA: 'arrived' } },
  guessWithAi: () => ({ code: 'delayed', score: 0.5 }),
};

const silentRoadLeg: Leg = {
  id: 'leg-1',
  type: 'road',
  order: 1,
  operatorId: 'op-rutasur',
  planned: { start: '2026-11-12T08:00:00Z', end: '2026-11-12T20:00:00Z' },
  events: [],
};

function event(rawText: string, reportedAt: string): OperatorEvent {
  return { legId: 'leg-1', rawText, reportedAt, operatorId: 'op-rutasur' };
}

const confidentWording = 'ENTREGADO EN MUELLE';
const sourcesWithConfidentGuess: NormalisationSources = {
  ...sources,
  guessWithAi: ({ rawText }) => rawText === confidentWording
    ? { code: 'arrived', score: 0.95 }
    : { code: 'delayed', score: 0.5 },
};

const departed = event('SALIDA', '2026-11-12T08:30:00Z');
const ambiguous = event('PARADA EN FRONTERA', '2026-11-12T11:00:00Z');
const now = '2026-11-12T12:00:00Z';
const isNextToReport = true;

describe('deriveLegView', () => {
  it('draws a leg finished by a reliable terminal event as solid', () => {
    const leg = { ...silentRoadLeg, events: [departed, event('LLEGADA', '2026-11-12T11:30:00Z')] };

    const view = deriveLegView(leg, now, sources, 'customer', isNextToReport);

    expect(view.line).toBe('solid');
  });

  it('draws a leg started by a reliable non-terminal event as dashed', () => {
    const leg = { ...silentRoadLeg, events: [departed] };

    const view = deriveLegView(leg, now, sources, 'customer', isNextToReport);

    expect(view.line).toBe('dashed');
  });

  it('draws a leg whose latest event needs review as muted, with the earlier fact as last confirmed', () => {
    const leg = { ...silentRoadLeg, events: [departed, ambiguous] };

    const view = deriveLegView(leg, now, sources, 'ops', isNextToReport);

    expect(view.line).toBe('muted');
    expect(view.lastConfirmed).toEqual({ phrase: 'In transit', reportedAt: departed.reportedAt, operatorId: 'op-rutasur' });
  });

  it('shows the customer a needs-review leg as awaiting details, never the proposed status', () => {
    const leg = { ...silentRoadLeg, events: [departed, ambiguous] };

    const view = deriveLegView(leg, now, sources, 'customer', isNextToReport);

    expect(view.state).toEqual({ kind: 'unknown', text: 'Awaiting details from operator' });
    expect(JSON.stringify(view.state)).not.toContain('Delayed');
  });

  it('gives ops the latest raw wording with how it was interpreted', () => {
    const leg = { ...silentRoadLeg, events: [departed, ambiguous] };

    const view = deriveLegView(leg, now, sources, 'ops', isNextToReport);

    expect(view.report).toEqual({ rawText: 'PARADA EN FRONTERA', method: 'ai', confidence: 'low' });
  });

  it.each([
    ['understood by rule', [departed]],
    ['understood by AI with high confidence', [departed, event(confidentWording, '2026-11-12T11:00:00Z')]],
    ['waiting for review', [departed, ambiguous]],
  ])('never gives the customer the operator wording of a leg %s', (_case, events) => {
    const leg = { ...silentRoadLeg, events };

    const view = deriveLegView(leg, now, sourcesWithConfidentGuess, 'customer', isNextToReport);

    expect(view.report).toBeUndefined();
    for (const { rawText } of events) expect(JSON.stringify(view)).not.toContain(rawText);
  });

  it('warns ops about a silent leg past its stale threshold, but never the customer', () => {
    const pastThreshold = '2026-11-12T17:00:00Z';

    const opsView = deriveLegView(silentRoadLeg, pastThreshold, sources, 'ops', isNextToReport);
    const customerView = deriveLegView(silentRoadLeg, pastThreshold, sources, 'customer', isNextToReport);

    expect(opsView.warning).toEqual({ thresholdHours: 8 });
    expect(customerView.warning).toBeUndefined();
  });

  it('does not warn ops about a silent leg that is waiting for an earlier leg to finish', () => {
    const pastThreshold = '2026-11-12T17:00:00Z';
    const waitingForEarlierLeg = false;

    const view = deriveLegView(silentRoadLeg, pastThreshold, sources, 'ops', waitingForEarlierLeg);

    expect(view.warning).toBeUndefined();
    expect(view.state).toEqual({ kind: 'unknown', text: 'Awaiting details from operator' });
  });

  it('does not warn ops about a silent leg within its stale threshold', () => {
    const view = deriveLegView(silentRoadLeg, now, sources, 'ops', isNextToReport);

    expect(view.warning).toBeUndefined();
    expect(view.state).toEqual({ kind: 'unknown', text: 'No data for 4h' });
  });
});
