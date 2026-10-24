import type { Reliability } from './shipment';

export type DeliveryOutlook = 'delivered' | 'on-time' | 'possible-delay' | 'delayed' | 'awaiting-details';

export const deliveryOutlookLabels: Record<DeliveryOutlook, string> = {
  'delivered': 'Delivered',
  'on-time': 'On time',
  'possible-delay': 'Possible delay',
  'delayed': 'Delayed',
  'awaiting-details': 'Awaiting details from operator',
};

type DeliveryOutlookInput = {
  eta: Reliability<string>;
  // `planned.end` of the last leg: the booking promise, not an estimate.
  promised: string;
  delivered: boolean;
};

export function deriveDeliveryOutlook({ eta, promised, delivered }: DeliveryOutlookInput): DeliveryOutlook {
  if (delivered) return 'delivered';
  if (eta.kind === 'unknown') return 'awaiting-details';

  const [earliest, latest] = eta.kind === 'estimated' ? eta.range : [eta.value, eta.value];
  const promisedTime = Date.parse(promised);
  if (Date.parse(latest) <= promisedTime) return 'on-time';
  if (Date.parse(earliest) > promisedTime) return 'delayed';
  return 'possible-delay';
}
