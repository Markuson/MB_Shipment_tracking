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

// The newest report from any operator on the shipment: a fact, so it is safe to show the customer too.
export function findLastOperatorUpdate(shipment: Shipment) {
  const reportTimes = shipment.legs.flatMap(leg => leg.events.map(event => event.reportedAt));
  return reportTimes.toSorted((first, second) => Date.parse(second) - Date.parse(first)).at(0);
}
