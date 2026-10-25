import type { Shipment } from './shipment';

export type SiteSelection = { kind: 'all' } | { kind: 'site'; siteId: string } | { kind: 'invalid' };

// "All sites" submits an empty value. A repeated parameter is not a choice we can honour,
// so it is invalid rather than silently widening to every site.
export function parseSiteParam(siteParam: string | string[] | undefined): SiteSelection {
  if (siteParam === undefined || siteParam === '') return { kind: 'all' };
  if (typeof siteParam === 'string') return { kind: 'site', siteId: siteParam };
  return { kind: 'invalid' };
}

// An unknown site matches nothing rather than falling back to all, so a typo never reads as "every site".
export function filterShipmentsBySite(shipments: Shipment[], selection: SiteSelection) {
  if (selection.kind === 'all') return shipments;
  if (selection.kind === 'invalid') return [];
  return shipments.filter(shipment => shipment.originSiteId === selection.siteId);
}
