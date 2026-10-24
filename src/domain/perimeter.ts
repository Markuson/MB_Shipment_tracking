import type { Shipment } from './shipment';
import type { ActiveView } from './viewer';

// There is a single ops user, so ops sees every shipment; a per-site ops perimeter is a next step.
export function filterShipmentsForViewer(shipments: Shipment[], view: ActiveView) {
  if (view.role === 'ops') return shipments;
  return shipments.filter(shipment => shipment.accountId === view.accountId);
}
