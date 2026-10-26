import { describe, expect, it } from 'vitest';
import { estimateDelivery, type RouteHistory } from './eta';
import type { NormalisationSources } from './normalise';
import type { Leg, OperatorEvent, Shipment } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: {
    'op-rutasur': { SALIDA: 'in-transit', RETRASO: 'delayed' },
    'op-lastmile': { ENTREGADO: 'delivered' },
    'op-aduana': { RETENIDO: 'held' },
  },
  guessWithAi: () => ({ code: 'unrecognised', score: 0 }),
};

const promised = '2026-11-15T18:00:00Z';
const now = '2026-11-14T12:00:00Z';

function event(legId: string, operatorId: string, rawText: string, reportedAt: string): OperatorEvent {
  return { legId, rawText, reportedAt, operatorId };
}

function leg(id: string, type: Leg['type'], operatorId: string, order: number, events: OperatorEvent[], end: string): Leg {
  return { id, type, order, operatorId, planned: { start: '2026-11-14T06:00:00Z', end }, events };
}

function shipmentWith(legs: Leg[]): Shipment {
  return { id: 'shp-1', accountId: 'acc-1', originSiteId: 'site-1', destination: { city: 'Lyon', country: 'FR' }, legs };
}

const departed = event('road', 'op-rutasur', 'SALIDA', '2026-11-14T06:10:00Z');

const history: RouteHistory = {
  'site-1>Lyon': {
    onSchedule: { earliestHours: -6, latestHours: 0, confidence: 'high', reason: 'On time on this route.' },
    delayedOn: { road: { earliestHours: 2, latestHours: 24, confidence: 'medium', reason: 'Road delays here.' } },
  },
};

describe('estimateDelivery', () => {
  it('confirms the delivery time once the last leg is reliably delivered', () => {
    const delivered = event('last-mile', 'op-lastmile', 'ENTREGADO', '2026-11-14T11:00:00Z');
    const shipment = shipmentWith([leg('last-mile', 'last-mile', 'op-lastmile', 1, [delivered], promised)]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toMatchObject({ kind: 'confirmed', value: delivered.reportedAt });
  });

  it('estimates an on-schedule shipment from its route history, with the reason', () => {
    const shipment = shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed], promised)]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toEqual({
      kind: 'estimated',
      range: ['2026-11-15T12:00:00.000Z', '2026-11-15T18:00:00.000Z'],
      confidence: 'high',
      reasons: ['On time on this route.'],
    });
  });

  it('uses the history of the leg type that reported a delay', () => {
    const delayed = event('road', 'op-rutasur', 'RETRASO', '2026-11-14T09:00:00Z');
    const shipment = shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed, delayed], promised)]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toMatchObject({ kind: 'estimated', range: ['2026-11-15T20:00:00.000Z', '2026-11-16T18:00:00.000Z'] });
  });

  it('gives no estimate while customs hold the shipment', () => {
    const held = event('customs', 'op-aduana', 'RETENIDO', '2026-11-14T09:00:00Z');
    const shipment = shipmentWith([leg('customs', 'customs', 'op-aduana', 1, [held], promised)]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toEqual({ kind: 'unknown' });
  });

  it('gives no estimate while the current status needs review', () => {
    const ambiguous = event('road', 'op-rutasur', 'PARADA', '2026-11-14T09:00:00Z');
    const shipment = shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed, ambiguous], promised)]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toEqual({ kind: 'unknown' });
  });

  it('gives no estimate for a route with no history', () => {
    const shipment = { ...shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed], promised)]), originSiteId: 'site-2' };

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toEqual({ kind: 'unknown' });
  });

  it('gives no estimate when the whole historical range is already in the past', () => {
    const shipment = shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed], '2026-11-14T08:00:00Z')]);

    const eta = estimateDelivery(shipment, '2026-11-15T12:00:00Z', sources, history);

    expect(eta).toEqual({ kind: 'unknown' });
  });

  it('never starts the range before now', () => {
    const shipment = shipmentWith([leg('road', 'road', 'op-rutasur', 1, [departed], '2026-11-14T14:00:00Z')]);

    const eta = estimateDelivery(shipment, now, sources, history);

    expect(eta).toMatchObject({ kind: 'estimated', range: [now, '2026-11-14T14:00:00.000Z'] });
  });
});
