import { describe, expect, it } from 'vitest';
import { filterShipmentsForViewer } from './perimeter';
import type { Shipment } from './shipment';

const shipments: Shipment[] = [
  { id: 'shp-rhone', accountId: 'acc-rhone', originSiteId: 'site-valencia', destination: { city: 'Lyon', country: 'FR' }, legs: [] },
  { id: 'shp-hamburg', accountId: 'acc-hamburg', originSiteId: 'site-valencia', destination: { city: 'Hamburg', country: 'DE' }, legs: [] },
];

describe('filterShipmentsForViewer', () => {
  it('gives a customer only the shipments of their own account', () => {
    const visible = filterShipmentsForViewer(shipments, { role: 'customer', accountId: 'acc-hamburg' });

    expect(visible.map(shipment => shipment.id)).toEqual(['shp-hamburg']);
  });

  it('gives a customer with an unknown account no shipments', () => {
    const visible = filterShipmentsForViewer(shipments, { role: 'customer', accountId: 'acc-unknown' });

    expect(visible).toEqual([]);
  });
});
