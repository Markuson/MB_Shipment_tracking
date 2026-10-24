import type { AiGuess, NormalisationSources, RuleTable } from '@/domain/normalise';
import type { OperatorEvent } from '@/domain/shipment';

export const ruleTable: RuleTable = {
  'op-rutasur': {
    'SALIDA DE ALMACÉN': 'in-transit',
    'RETRASO EN RUTA': 'delayed',
    'LLEGADA A DESTINO': 'arrived',
  },
  'op-oceanis': {
    'GTI': 'awaiting-vessel',
    'LOD': 'loaded',
    'DEP': 'departed',
    'ANC': 'delayed',
    'ARR': 'arrived',
    'DIS': 'discharged',
    'CPD': 'pending',
    'CHD-DOC': 'held',
    'CCL': 'cleared',
  },
  'op-lastmile': {
    'Out for delivery': 'out-for-delivery',
    'Delivered': 'delivered',
    'Delivery failed': 'delivery-exception',
  },
};

// Stands in for a model: free-text wording no rule covers, with the score it would return.
const simulatedAiGuesses: Record<string, AiGuess> = {
  'PARADA TÉCNICA EN FRONTERA': { code: 'delayed', score: 0.55 },
  'Handed over at reception, signed': { code: 'delivered', score: 0.92 },
};

// A zero score always lands in the low band, so this code is never shown as a status.
const unrecognisedGuess: AiGuess = { code: 'unrecognised', score: 0 };

function guessWithAi(event: OperatorEvent) {
  return simulatedAiGuesses[event.rawText] ?? unrecognisedGuess;
}

export const mockNormalisationSources: NormalisationSources = {
  corrections: [],
  ruleTable,
  guessWithAi,
};
