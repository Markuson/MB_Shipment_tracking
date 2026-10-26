import type { OperatorEvent, Shipment } from './shipment';

// What the demo reports on an operator's behalf; the simulated clock supplies the time.
export type InjectedReport = Omit<OperatorEvent, 'reportedAt'>;

// Only legs of the shipment given receive an event, so a new report never widens the viewer's perimeter.
export function withOperatorEvents(shipment: Shipment, events: OperatorEvent[]): Shipment {
  return {
    ...shipment,
    legs: shipment.legs.map(leg => ({
      ...leg,
      events: [...leg.events, ...events.filter(event => event.legId === leg.id)],
    })),
  };
}
