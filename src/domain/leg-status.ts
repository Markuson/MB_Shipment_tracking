import { normalise, type NormalisationSources } from './normalise';
import type { Leg, NormalisedStatus, Reliability } from './shipment';
import { staleThresholdHours } from './vocabulary';

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

// Before the threshold, silence is normal operator latency and must not raise a warning.
export function isStale(leg: Leg, now: string) {
  if (leg.events.length > 0) return false;
  return hoursBetween(leg.planned.start, now) > staleThresholdHours[leg.type];
}
