import { describe, expect, it } from 'vitest';
import type { Shipment } from './shipment';
import { filterShipmentsBySite, parseSiteParam } from './site-filter';

function shipmentFrom(id: string, originSiteId: string): Shipment {
  return { id, accountId: 'acc-1', originSiteId, destination: { city: 'Lyon', country: 'FR' }, legs: [] };
}

const shipments = [shipmentFrom('shp-1', 'site-valencia'), shipmentFrom('shp-2', 'site-zaragoza')];

describe('filterShipmentsBySite', () => {
  it('keeps only the shipments that leave from the chosen site', () => {
    const filtered = filterShipmentsBySite(shipments, { kind: 'site', siteId: 'site-zaragoza' });

    expect(filtered.map(shipment => shipment.id)).toEqual(['shp-2']);
  });

  it('returns every shipment when no site is chosen', () => {
    const filtered = filterShipmentsBySite(shipments, { kind: 'all' });

    expect(filtered).toEqual(shipments);
  });

  it('returns no shipments for an unknown site', () => {
    const filtered = filterShipmentsBySite(shipments, { kind: 'site', siteId: 'site-unknown' });

    expect(filtered).toEqual([]);
  });

  it('returns no shipments for an invalid selection', () => {
    const filtered = filterShipmentsBySite(shipments, { kind: 'invalid' });

    expect(filtered).toEqual([]);
  });
});

describe('parseSiteParam', () => {
  it('reads a missing or empty parameter as all sites', () => {
    expect(parseSiteParam(undefined)).toEqual({ kind: 'all' });
    expect(parseSiteParam('')).toEqual({ kind: 'all' });
  });

  it('reads a single value as that site', () => {
    const selection = parseSiteParam('site-valencia');

    expect(selection).toEqual({ kind: 'site', siteId: 'site-valencia' });
  });

  it('reads a repeated parameter as invalid, never as all sites', () => {
    const selection = parseSiteParam(['site-valencia', 'site-zaragoza']);

    expect(selection).toEqual({ kind: 'invalid' });
  });
});
