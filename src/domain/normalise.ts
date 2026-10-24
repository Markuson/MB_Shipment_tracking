import type { NormalisedStatus, OperatorEvent, OpsDecision } from './shipment';
import { confidenceBand } from './vocabulary';

// Per operator, raw wording to status code.
export type RuleTable = Record<string, Record<string, string>>;
export type AiGuess = { code: string; score: number };

// The rule table and the simulated model are invented data, so they are passed in rather than imported.
export type NormalisationSources = {
  corrections: OpsDecision[];
  ruleTable: RuleTable;
  guessWithAi: (event: OperatorEvent) => AiGuess;
};

export function normalise(event: OperatorEvent, sources: NormalisationSources): NormalisedStatus {
  const correction = sources.corrections.find(
    decision => decision.operatorId === event.operatorId && decision.rawText === event.rawText,
  );
  if (correction) return correction.status;

  const ruleCode = sources.ruleTable[event.operatorId]?.[event.rawText];
  if (ruleCode) return { code: ruleCode, method: 'rule', needsReview: false };

  const guess = sources.guessWithAi(event);
  const confidence = confidenceBand(guess.score);
  return { code: guess.code, method: 'ai', confidence, needsReview: confidence === 'low' };
}
