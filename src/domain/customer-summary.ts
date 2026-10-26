import { deriveCustomerAlerts, type CustomerAlert } from './customer-alerts';
import { deriveDeliveryOutlook, type DeliveryOutlook } from './delivery-outlook';
import { estimateDelivery, type RouteHistory } from './eta';
import type { NormalisationSources } from './normalise';
import type { Reliability, Shipment } from './shipment';

// Why there is no delivery date, in terms the customer already sees in an alert.
export type DeliveryBlocker = 'held-by-customs' | 'delayed' | 'behind-schedule';

export type CustomerSummary = {
  eta: Reliability<string>;
  outlook: DeliveryOutlook;
  alerts: CustomerAlert[];
  // The booking of the last leg: a commitment, not a fact or an estimate.
  promised?: string;
  blocker?: DeliveryBlocker;
};

function findDeliveryBlocker(alerts: CustomerAlert[]): DeliveryBlocker | undefined {
  if (alerts.some(alert => alert.cause === 'customs-hold')) return 'held-by-customs';
  const delay = alerts.at(0);
  if (!delay) return undefined;
  return delay.basis === 'reported' ? 'delayed' : 'behind-schedule';
}

export function deriveCustomerSummary(
  shipment: Shipment,
  now: string,
  sources: NormalisationSources,
  history: RouteHistory,
): CustomerSummary {
  const eta = estimateDelivery(shipment, now, sources, history);
  const alerts = deriveCustomerAlerts(shipment, now, sources);
  const promised = shipment.legs.at(-1)?.planned.end;
  const outlook = promised
    ? deriveDeliveryOutlook({ eta, promised, delivered: eta.kind === 'confirmed' })
    : 'awaiting-details';
  // Only explains a missing date; with an estimate, the alert alone says what happened.
  const blocker = eta.kind === 'unknown' ? findDeliveryBlocker(alerts) : undefined;
  return { eta, outlook, alerts, promised, blocker };
}
