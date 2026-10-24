import { filterShipmentsForViewer } from '@/domain/perimeter';
import type { ActiveView } from '@/domain/viewer';
import { mockShipments } from '@/mock/shipments';

const minimumLatencyMilliseconds = 300;
const latencySpreadMilliseconds = 200;

// A real API replaces this module; the delay keeps loading states real until then.
function waitForSimulatedLatency() {
  const latency = minimumLatencyMilliseconds + Math.random() * latencySpreadMilliseconds;
  return new Promise(resolve => setTimeout(resolve, latency));
}

export async function fetchShipments(view: ActiveView) {
  await waitForSimulatedLatency();
  return filterShipmentsForViewer(mockShipments, view);
}

// Outside the perimeter reads as not found, so a guessed id never confirms that a shipment exists.
export async function fetchShipment(view: ActiveView, shipmentId: string) {
  const visibleShipments = await fetchShipments(view);
  return visibleShipments.find(shipment => shipment.id === shipmentId);
}
