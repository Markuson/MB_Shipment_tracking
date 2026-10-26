import { normalise, type NormalisationSources } from './normalise';
import type { Leg, NormalisedStatus, Reliability, Shipment } from './shipment';
import { isTerminalStatus, staleThresholdHours } from './vocabulary';

const millisecondsPerHour = 60 * 60 * 1000;

// "No events" splits in two: not due yet (no `since`), or due and silent (`since` the planned start).
export function deriveLegStatus(leg: Leg, now: string, sources: NormalisationSources): Reliability<NormalisedStatus> {
  // Events are assumed appended in chronological order, so the last one is the latest.
  const latestEvent = leg.events.at(-1);
  if (latestEvent) {
    return {
      kind: 'confirmed',
      value: normalise(latestEvent, sources),
      reportedAt: latestEvent.reportedAt,
      source: latestEvent.operatorId,
    };
  }
  if (Date.parse(now) < Date.parse(leg.planned.start)) return { kind: 'unknown' };
  return { kind: 'unknown', since: leg.planned.start };
}

// The event itself is a fact either way; only an understood one can be shown as the current state.
export function isReliable(status: Reliability<NormalisedStatus>) {
  return status.kind === 'confirmed' && !status.value.needsReview;
}

export function hoursBetween(from: string, to: string) {
  return (Date.parse(to) - Date.parse(from)) / millisecondsPerHour;
}

function isFinished(leg: Leg, now: string, sources: NormalisationSources) {
  const status = deriveLegStatus(leg, now, sources);
  return status.kind === 'confirmed' && isReliable(status) && isTerminalStatus(leg.type, status.value.code);
}

// The cargo reaches a leg only once every earlier leg is finished; until then the leg's
// operator has nothing to report, so its silence is a consequence, not a finding.
export function isExpectedToReport(shipment: Shipment, leg: Leg, now: string, sources: NormalisationSources) {
  return shipment.legs
    .filter(earlierLeg => earlierLeg.order < leg.order)
    .every(earlierLeg => isFinished(earlierLeg, now, sources));
}

// Before the threshold, silence is normal operator latency and must not raise a warning.
export function isStale(leg: Leg, now: string, expectedToReport: boolean) {
  if (!expectedToReport || leg.events.length > 0) return false;
  return hoursBetween(leg.planned.start, now) > staleThresholdHours[leg.type];
}
