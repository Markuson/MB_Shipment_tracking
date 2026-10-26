import { deriveExceptions } from './exceptions';
import { isExpectedToReport } from './leg-status';
import { deriveLegView, type LegFact } from './leg-view';
import type { NormalisationSources } from './normalise';
import type { LegType, Shipment } from './shipment';

export type CustomerAlertCause = 'delay' | 'customs-hold';

// A factual status, derived like everything else, not a message: the facts are already on the
// customer's timeline. Silence and statuses under review stay internal until ops decide.
export type CustomerAlert = {
  shipmentId: string;
  legType: LegType;
  cause: CustomerAlertCause;
  basis: 'reported' | 'behind-plan';
  // The customer-safe fact on that leg, from the same view the customer timeline shows.
  fact?: LegFact;
  plannedEnd: string;
};

export function deriveCustomerAlerts(shipment: Shipment, now: string, sources: NormalisationSources) {
  return deriveExceptions(shipment, now, sources).flatMap((exception): CustomerAlert[] => {
    const leg = shipment.legs.find(candidate => candidate.id === exception.legId);
    if (!leg) return [];
    if (exception.cause !== 'delay' && exception.cause !== 'customs-hold') return [];
    if (exception.basis === 'silence') return [];

    const view = deriveLegView(leg, now, sources, 'customer', isExpectedToReport(shipment, leg, now, sources));
    const fact = view.state.kind === 'confirmed' ? view.state.fact : view.lastConfirmed;
    return [{
      shipmentId: shipment.id,
      legType: leg.type,
      cause: exception.cause,
      basis: exception.basis,
      fact,
      plannedEnd: leg.planned.end,
    }];
  });
}
