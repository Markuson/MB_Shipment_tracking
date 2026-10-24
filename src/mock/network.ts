import type { Operator, Site } from '@/domain/shipment';

export const sites: Site[] = [
  { id: 'site-valencia', name: 'Valencia plant', city: 'Valencia', country: 'ES' },
  { id: 'site-zaragoza', name: 'Zaragoza warehouse', city: 'Zaragoza', country: 'ES' },
];

// Each one reports in its own format: Spanish free text, terse codes, English text.
export const operators: Operator[] = [
  { id: 'op-rutasur', name: 'RutaSur Transportes' },
  { id: 'op-oceanis', name: 'Oceanis Lines' },
  { id: 'op-lastmile', name: 'Lastmile Couriers' },
];
