import { describe, expect, it } from 'vitest';
import { withOperatorEvents } from './operator-feed';
import type { OperatorEvent, Shipment } from './shipment';

const shipment: Shipment = {
  id: 'shp-1',
  accountId: 'acc-1',
  originSiteId: 'site-1',
  destination: { city: 'Hamburg', country: 'DE' },
  legs: [
    {
      id: 'shp-1-sea',
      type: 'sea',
      order: 1,
      operatorId: 'op-oceanis',
      planned: { start: '2026-11-09T18:00:00Z', end: '2026-11-15T06:00:00Z' },
      events: [{ legId: 'shp-1-sea', rawText: 'DEP', reportedAt: '2026-11-09T19:10:00Z', operatorId: 'op-oceanis' }],
    },
  ],
};

describe('withOperatorEvents', () => {
  it('adds a new report as the latest event of its leg', () => {
    const anchored: OperatorEvent = {
      legId: 'shp-1-sea',
      rawText: 'ANC',
      reportedAt: '2026-11-14T12:00:00Z',
      operatorId: 'op-oceanis',
    };

    const updated = withOperatorEvents(shipment, [anchored]);

    expect(updated.legs.at(0)?.events.at(-1)).toEqual(anchored);
  });

  it('ignores a report for a leg of another shipment', () => {
    const otherShipmentEvent: OperatorEvent = {
      legId: 'shp-2-customs',
      rawText: 'CHD-DOC',
      reportedAt: '2026-11-14T12:00:00Z',
      operatorId: 'op-oceanis',
    };

    const updated = withOperatorEvents(shipment, [otherShipmentEvent]);

    expect(updated).toEqual(shipment);
  });
});
