export type Site = { id: string; name: string; city: string; country: string };
export type Operator = { id: string; name: string };

export type LegType = 'road' | 'port' | 'sea' | 'customs' | 'last-mile';

export type ConfidenceBand = 'high' | 'medium' | 'low';

// What the operator actually sent: always a confirmed fact when present.
export type OperatorEvent = {
  legId: string;
  rawText: string;
  reportedAt: string;
  operatorId: string;
};

// What we think the event means: a separate, weaker claim than the event itself.
// Only an AI inference carries a confidence; a rule match or a correction is deterministic.
export type CorrectedStatus = { code: string; method: 'correction'; needsReview: false };

export type NormalisedStatus
  = { code: string; method: 'rule'; needsReview: false }
    | CorrectedStatus
    | { code: string; method: 'ai'; confidence: ConfidenceBand; needsReview: boolean };

export type Leg = {
  id: string;
  type: LegType;
  order: number;
  operatorId: string;
  // A booking promise: not a fact and not our estimate.
  planned: { start: string; end: string };
  events: OperatorEvent[];
};

export type Shipment = {
  id: string;
  accountId: string;
  originSiteId: string;
  destination: { city: string; country: string };
  legs: Leg[];
};

// Keyed by operator + exact wording, never by leg, so a newer event is never hidden behind it.
export type OpsDecision = {
  type: 'status-correction';
  operatorId: string;
  rawText: string;
  status: CorrectedStatus;
  correctedBy: string;
  at: string;
};

export type Reliability<T>
  = { kind: 'confirmed'; value: T; reportedAt: string; source: string }
    | { kind: 'estimated'; range: [T, T]; confidence: ConfidenceBand; reasons: string[] }
    | { kind: 'unknown'; since?: string };
