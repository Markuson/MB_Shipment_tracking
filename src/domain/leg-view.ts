import { deriveLegStatus, hoursBetween, isReliable, isStale } from './leg-status';
import { normalise, type NormalisationSources } from './normalise';
import type { Leg, LegType } from './shipment';
import type { ActiveView } from './viewer';
import { isTerminalStatus, staleThresholdHours, statusPhrase } from './vocabulary';

export type ViewerRole = ActiveView['role'];
export type LegLine = 'solid' | 'dashed' | 'muted';
export type LegTone = 'neutral' | 'caution' | 'critical';

export type LegFact = { phrase: string; reportedAt: string; operatorId: string };

export type LegState
  = { kind: 'confirmed'; fact: LegFact; terminal: boolean }
    | { kind: 'needs-review'; text: string; proposedPhrase: string }
    | { kind: 'unknown'; text: string };

export type LegView = {
  legId: string;
  legType: LegType;
  line: LegLine;
  tone: LegTone;
  state: LegState;
  lastConfirmed?: LegFact;
  warning?: { thresholdHours: number };
};

export const legTypeLabel: Record<LegType, string> = {
  'road': 'Road',
  'port': 'Port',
  'sea': 'Sea',
  'customs': 'Customs',
  'last-mile': 'Last mile',
};

const awaitingDetailsText = 'Awaiting details from operator';

function toneForCode(legType: LegType, code: string): LegTone {
  if (legType === 'customs' && code === 'held') return 'critical';
  if (code === 'delayed' || code === 'delivery-exception') return 'caution';
  return 'neutral';
}

function toFact(leg: Leg, code: string, reportedAt: string, operatorId: string): LegFact {
  return { phrase: statusPhrase(leg.type, code), reportedAt, operatorId };
}

// Shown beneath an unknown current state, so it must be a fact we understood, never a guess.
function findLastConfirmedFact(leg: Leg, sources: NormalisationSources) {
  const earlierEvents = leg.events.slice(0, -1).toReversed();
  for (const event of earlierEvents) {
    const status = normalise(event, sources);
    if (!status.needsReview) return toFact(leg, status.code, event.reportedAt, event.operatorId);
  }
  return undefined;
}

function silentLegText(leg: Leg, now: string, role: ViewerRole) {
  if (role === 'customer') return awaitingDetailsText;
  return `No data for ${Math.floor(hoursBetween(leg.planned.start, now))}h`;
}

// The customer never sees a warning: past the threshold is an ops matter, not news for them.
function findWarning(leg: Leg, now: string, role: ViewerRole) {
  if (role !== 'ops' || !isStale(leg, now)) return undefined;
  return { thresholdHours: staleThresholdHours[leg.type] };
}

export function deriveLegView(leg: Leg, now: string, sources: NormalisationSources, role: ViewerRole): LegView {
  const status = deriveLegStatus(leg, now, sources);
  const base = { legId: leg.id, legType: leg.type, warning: findWarning(leg, now, role) };

  if (status.kind === 'confirmed' && isReliable(status)) {
    const { code } = status.value;
    const terminal = isTerminalStatus(leg.type, code);
    return {
      ...base,
      line: terminal ? 'solid' : 'dashed',
      tone: toneForCode(leg.type, code),
      state: { kind: 'confirmed', fact: toFact(leg, code, status.reportedAt, status.source), terminal },
    };
  }

  if (status.kind === 'confirmed') {
    // The customer gets the unknown state, never the guess, until ops decides.
    const state: LegState = role === 'ops'
      ? { kind: 'needs-review', text: 'Needs review', proposedPhrase: statusPhrase(leg.type, status.value.code) }
      : { kind: 'unknown', text: awaitingDetailsText };
    return { ...base, line: 'muted', tone: 'neutral', state, lastConfirmed: findLastConfirmedFact(leg, sources) };
  }

  const isDue = status.kind === 'unknown' && status.since !== undefined;
  const text = isDue ? silentLegText(leg, now, role) : 'Not started';
  return { ...base, line: 'muted', tone: 'neutral', state: { kind: 'unknown', text } };
}
