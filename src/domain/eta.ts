import { deriveExceptions } from './exceptions';
import { addHours, deriveLegStatus, isFinished } from './leg-status';
import type { NormalisationSources } from './normalise';
import type { ConfidenceBand, LegType, Reliability, Shipment } from './shipment';

// Hours relative to the promised delivery, as observed on past shipments in the same situation.
export type HistoryEntry = {
  earliestHours: number;
  latestHours: number;
  confidence: ConfidenceBand;
  reason: string;
};

export type RouteRecord = {
  onSchedule?: HistoryEntry;
  delayedOn?: Partial<Record<LegType, HistoryEntry>>;
};

export type RouteHistory = Partial<Record<string, RouteRecord>>;

function routeKey(shipment: Shipment) {
  return `${shipment.originSiteId}>${shipment.destination.city}`;
}

// The situation reuses the exceptions, so the estimate never disagrees with what ops see.
// A customs hold, a status under review or a silent operator leaves nothing to estimate from.
function findHistoryEntry(shipment: Shipment, now: string, sources: NormalisationSources, history: RouteHistory) {
  const exceptions = deriveExceptions(shipment, now, sources);
  const blocksEstimate = exceptions.some(exception => exception.cause !== 'delay');
  if (blocksEstimate) return undefined;

  const route = history[routeKey(shipment)];
  const delay = exceptions.at(0);
  if (!delay) return route?.onSchedule;
  const delayedLeg = shipment.legs.find(leg => leg.id === delay.legId);
  return delayedLeg && route?.delayedOn?.[delayedLeg.type];
}

function findDelivery(shipment: Shipment, now: string, sources: NormalisationSources) {
  const lastLeg = shipment.legs.at(-1);
  if (!lastLeg || !isFinished(lastLeg, now, sources)) return undefined;
  const status = deriveLegStatus(lastLeg, now, sources);
  return status.kind === 'confirmed' ? status : undefined;
}

// Never invents a date: with no history for the situation, or a range already in the past, it stays unknown.
export function estimateDelivery(
  shipment: Shipment,
  now: string,
  sources: NormalisationSources,
  history: RouteHistory,
): Reliability<string> {
  const delivery = findDelivery(shipment, now, sources);
  if (delivery) {
    return { kind: 'confirmed', value: delivery.reportedAt, reportedAt: delivery.reportedAt, source: delivery.source };
  }

  const promised = shipment.legs.at(-1)?.planned.end;
  const entry = findHistoryEntry(shipment, now, sources, history);
  if (!promised || !entry) return { kind: 'unknown' };

  const latest = addHours(promised, entry.latestHours);
  if (Date.parse(latest) < Date.parse(now)) return { kind: 'unknown' };
  // A shipment still on its way cannot arrive before now, whatever history says.
  const earliest = addHours(promised, entry.earliestHours);
  const reachableEarliest = Date.parse(earliest) < Date.parse(now) ? now : earliest;

  return { kind: 'estimated', range: [reachableEarliest, latest], confidence: entry.confidence, reasons: [entry.reason] };
}
