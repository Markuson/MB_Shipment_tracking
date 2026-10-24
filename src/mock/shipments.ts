import type { Leg, LegType, Shipment } from '@/domain/shipment';

// The simulated clock starts here, so the demo looks the same whenever it is opened.
export const demoStartTime = '2026-11-14T12:00:00Z';

type LegInput = {
  id: string;
  type: LegType;
  operatorId: string;
  planned: Leg['planned'];
  events?: [rawText: string, reportedAt: string][];
};

function buildLegs(legs: LegInput[]): Leg[] {
  return legs.map(({ events = [], ...leg }, index) => ({
    ...leg,
    order: index + 1,
    events: events.map(([rawText, reportedAt]) => ({ legId: leg.id, rawText, reportedAt, operatorId: leg.operatorId })),
  }));
}

// One shipment per challenge of the brief; each comment names the case it proves.
export const mockShipments: Shipment[] = [
  // 1. Domestic road, no incidents.
  {
    id: 'shp-1001',
    accountId: 'acc-rhone',
    originSiteId: 'site-zaragoza',
    destination: { city: 'Barcelona', country: 'ES' },
    legs: buildLegs([
      {
        id: 'shp-1001-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-14T06:00:00Z', end: '2026-11-14T16:00:00Z' },
        events: [['SALIDA DE ALMACÉN', '2026-11-14T06:20:00Z']],
      },
    ]),
  },
  // 2. Hero: multimodal international, the vessel waits at anchor for a berth in Hamburg.
  {
    id: 'shp-1002',
    accountId: 'acc-hamburg',
    originSiteId: 'site-valencia',
    destination: { city: 'Hamburg', country: 'DE' },
    legs: buildLegs([
      {
        id: 'shp-1002-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-08T07:00:00Z', end: '2026-11-08T12:00:00Z' },
        events: [['SALIDA DE ALMACÉN', '2026-11-08T07:15:00Z'], ['LLEGADA A DESTINO', '2026-11-08T11:40:00Z']],
      },
      {
        id: 'shp-1002-port-valencia',
        type: 'port',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-08T12:00:00Z', end: '2026-11-09T18:00:00Z' },
        events: [['GTI', '2026-11-08T12:30:00Z'], ['LOD', '2026-11-09T16:30:00Z']],
      },
      {
        id: 'shp-1002-sea',
        type: 'sea',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-09T18:00:00Z', end: '2026-11-14T06:00:00Z' },
        events: [['DEP', '2026-11-09T19:10:00Z'], ['ANC', '2026-11-13T21:00:00Z']],
      },
      {
        id: 'shp-1002-port-hamburg',
        type: 'port',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-14T06:00:00Z', end: '2026-11-14T20:00:00Z' },
      },
      {
        id: 'shp-1002-last-mile',
        type: 'last-mile',
        operatorId: 'op-lastmile',
        planned: { start: '2026-11-15T08:00:00Z', end: '2026-11-15T18:00:00Z' },
      },
    ]),
  },
  // 3. Customs hold for a missing document, on the longest route.
  {
    id: 'shp-1003',
    accountId: 'acc-hamburg',
    originSiteId: 'site-valencia',
    destination: { city: 'Felixstowe', country: 'GB' },
    legs: buildLegs([
      {
        id: 'shp-1003-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-06T07:00:00Z', end: '2026-11-06T12:00:00Z' },
        events: [['SALIDA DE ALMACÉN', '2026-11-06T07:10:00Z'], ['LLEGADA A DESTINO', '2026-11-06T11:30:00Z']],
      },
      {
        id: 'shp-1003-port-valencia',
        type: 'port',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-06T12:00:00Z', end: '2026-11-07T18:00:00Z' },
        events: [['GTI', '2026-11-06T13:00:00Z'], ['LOD', '2026-11-07T15:00:00Z']],
      },
      {
        id: 'shp-1003-sea',
        type: 'sea',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-07T18:00:00Z', end: '2026-11-11T08:00:00Z' },
        events: [['DEP', '2026-11-07T18:40:00Z'], ['ARR', '2026-11-11T07:30:00Z']],
      },
      {
        id: 'shp-1003-port-felixstowe',
        type: 'port',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-11T08:00:00Z', end: '2026-11-11T20:00:00Z' },
        events: [['DIS', '2026-11-11T16:00:00Z']],
      },
      {
        id: 'shp-1003-customs',
        type: 'customs',
        operatorId: 'op-oceanis',
        planned: { start: '2026-11-11T20:00:00Z', end: '2026-11-13T20:00:00Z' },
        events: [['CPD', '2026-11-11T21:00:00Z'], ['CHD-DOC', '2026-11-12T09:00:00Z']],
      },
      {
        id: 'shp-1003-last-mile',
        type: 'last-mile',
        operatorId: 'op-lastmile',
        planned: { start: '2026-11-14T14:00:00Z', end: '2026-11-14T20:00:00Z' },
      },
    ]),
  },
  // 4. Operator silent: the truck was due to leave at 02:00 and nothing has arrived since.
  {
    id: 'shp-1004',
    accountId: 'acc-rhone',
    originSiteId: 'site-zaragoza',
    destination: { city: 'Lyon', country: 'FR' },
    legs: buildLegs([
      {
        id: 'shp-1004-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-14T02:00:00Z', end: '2026-11-14T22:00:00Z' },
      },
      {
        id: 'shp-1004-last-mile',
        type: 'last-mile',
        operatorId: 'op-lastmile',
        planned: { start: '2026-11-15T08:00:00Z', end: '2026-11-15T14:00:00Z' },
      },
    ]),
  },
  // 5. Ambiguous wording no rule covers: the AI guess is in the low band and needs review.
  {
    id: 'shp-1005',
    accountId: 'acc-hamburg',
    originSiteId: 'site-valencia',
    destination: { city: 'Hamburg', country: 'DE' },
    legs: buildLegs([
      {
        id: 'shp-1005-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-13T06:00:00Z', end: '2026-11-15T18:00:00Z' },
        events: [['SALIDA DE ALMACÉN', '2026-11-13T06:30:00Z'], ['PARADA TÉCNICA EN FRONTERA', '2026-11-14T08:00:00Z']],
      },
      {
        id: 'shp-1005-last-mile',
        type: 'last-mile',
        operatorId: 'op-lastmile',
        planned: { start: '2026-11-16T08:00:00Z', end: '2026-11-16T14:00:00Z' },
      },
    ]),
  },
  // 6. Delivered; the final event is free text the AI understood with high confidence.
  {
    id: 'shp-1006',
    accountId: 'acc-rhone',
    originSiteId: 'site-valencia',
    destination: { city: 'Lyon', country: 'FR' },
    legs: buildLegs([
      {
        id: 'shp-1006-road',
        type: 'road',
        operatorId: 'op-rutasur',
        planned: { start: '2026-11-10T06:00:00Z', end: '2026-11-11T14:00:00Z' },
        events: [['SALIDA DE ALMACÉN', '2026-11-10T06:10:00Z'], ['LLEGADA A DESTINO', '2026-11-11T12:00:00Z']],
      },
      {
        id: 'shp-1006-last-mile',
        type: 'last-mile',
        operatorId: 'op-lastmile',
        planned: { start: '2026-11-12T08:00:00Z', end: '2026-11-12T14:00:00Z' },
        events: [['Out for delivery', '2026-11-12T08:30:00Z'], ['Handed over at reception, signed', '2026-11-12T11:50:00Z']],
      },
    ]),
  },
];
