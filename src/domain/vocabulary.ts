import type { ConfidenceBand, LegType } from './shipment';

export type StatusDefinition = { code: string; phrase: string; terminal: boolean };

// Closed per leg type: "departed" on a sea leg and on a road leg are different states.
// A port leg has no origin/destination field, so both loading and discharge end it.
export const statusVocabulary: Record<LegType, StatusDefinition[]> = {
  'road': [
    { code: 'not-started', phrase: 'Not started', terminal: false },
    { code: 'in-transit', phrase: 'In transit', terminal: false },
    { code: 'delayed', phrase: 'Delayed', terminal: false },
    { code: 'arrived', phrase: 'Arrived', terminal: true },
  ],
  'sea': [
    { code: 'not-started', phrase: 'Not started', terminal: false },
    { code: 'departed', phrase: 'Departed', terminal: false },
    { code: 'in-transit', phrase: 'At sea', terminal: false },
    { code: 'delayed', phrase: 'Delayed', terminal: false },
    { code: 'arrived', phrase: 'Arrived at port', terminal: true },
  ],
  'port': [
    { code: 'awaiting-vessel', phrase: 'Awaiting vessel', terminal: false },
    { code: 'loaded', phrase: 'Loaded on vessel', terminal: true },
    { code: 'discharged', phrase: 'Discharged from vessel', terminal: true },
  ],
  'customs': [
    { code: 'pending', phrase: 'Customs pending', terminal: false },
    { code: 'held', phrase: 'Held by customs', terminal: false },
    { code: 'cleared', phrase: 'Cleared customs', terminal: true },
  ],
  'last-mile': [
    { code: 'out-for-delivery', phrase: 'Out for delivery', terminal: false },
    { code: 'delivered', phrase: 'Delivered', terminal: true },
    { code: 'delivery-exception', phrase: 'Delivery problem', terminal: false },
  ],
};

export function findStatusDefinition(legType: LegType, code: string) {
  return statusVocabulary[legType].find(definition => definition.code === code);
}

// The simulated AI can return a code outside the vocabulary; it must still read as words, never as a raw code.
export function statusPhrase(legType: LegType, code: string) {
  return findStatusDefinition(legType, code)?.phrase ?? 'Unrecognised wording';
}

export function isTerminalStatus(legType: LegType, code: string) {
  return findStatusDefinition(legType, code)?.terminal ?? false;
}

// Assumed for the prototype, not operator facts: operators on slower modes report less often.
export const staleThresholdHours: Record<LegType, number> = {
  'road': 8,
  'port': 24,
  'sea': 48,
  'customs': 24,
  'last-mile': 6,
};

const highConfidenceMinimum = 0.85;
const mediumConfidenceMinimum = 0.7;

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= highConfidenceMinimum) return 'high';
  if (score >= mediumConfidenceMinimum) return 'medium';
  return 'low';
}
