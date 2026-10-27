import { describe, expect, it } from 'vitest';
import type { ShipmentException } from './exceptions';
import type { NoticeTemplate } from './next-action';
import type { NormalisationSources } from './normalise';
import {
  draftNotice,
  isActionTaken,
  isNoticeApproved,
  noticesForShipment,
  type ApprovedNotice,
  type LoggedRequest,
} from './notice';
import type { Leg, OperatorEvent, Shipment } from './shipment';

const sources: NormalisationSources = {
  corrections: [],
  ruleTable: { 'op-1': { SALIDA: 'in-transit', RETRASO: 'delayed' } },
  guessWithAi: () => ({ code: 'delayed', score: 0.3 }),
};

const operators = [{ id: 'op-1', name: 'Rutasur' }];

const template: NoticeTemplate = {
  subject: 'Your shipment is delayed',
  draftBody: ({ destinationCity, legPhrase, formattedSince }) => `To ${destinationCity}, ${legPhrase}, since ${formattedSince}.`,
};

function event(rawText: string, reportedAt: string): OperatorEvent {
  return { legId: 'leg-road', rawText, reportedAt, operatorId: 'op-1' };
}

function shipmentWith(events: OperatorEvent[]): Shipment {
  const leg: Leg = {
    id: 'leg-road',
    type: 'road',
    order: 1,
    operatorId: 'op-1',
    planned: { start: '2026-11-14T00:00:00Z', end: '2026-11-14T08:00:00Z' },
    events,
  };
  return { id: 'shp-1', accountId: 'acc-1', originSiteId: 'site-1', destination: { city: 'Lyon', country: 'FR' }, legs: [leg] };
}

function delay(basis: ShipmentException['basis'], since: string): ShipmentException {
  return { shipmentId: 'shp-1', legId: 'leg-road', cause: 'delay', severity: 'caution', basis, since };
}

function approvedNotice(shipmentId: string): ApprovedNotice {
  return {
    shipmentId,
    legId: 'leg-road',
    cause: 'delay',
    subject: 'Your shipment is delayed',
    text: 'Delayed.',
    approvedAt: '2026-11-14T12:00:00Z',
  };
}

describe('draftNotice', () => {
  it('fills the template and cites the event the carrier reported', () => {
    const shipment = shipmentWith([event('RETRASO', '2026-11-14T09:00:00Z')]);

    const draft = draftNotice(delay('reported', '2026-11-14T09:00:00Z'), shipment, template, sources, operators);

    expect(draft).toEqual({
      shipmentId: 'shp-1',
      legId: 'leg-road',
      cause: 'delay',
      subject: 'Your shipment is delayed',
      text: 'To Lyon, road leg, since 14 Nov 10:00.',
      basedOn: ['"RETRASO" from Rutasur, 14 Nov 10:00: Delayed'],
    });
  });

  it('cites the booking and the last report for a leg behind plan, without inventing a delay event', () => {
    const shipment = shipmentWith([event('SALIDA', '2026-11-14T01:00:00Z')]);

    const draft = draftNotice(delay('behind-plan', '2026-11-14T08:00:00Z'), shipment, template, sources, operators);

    expect(draft?.basedOn).toEqual([
      'Booking: road leg planned to finish by 14 Nov 09:00',
      '"SALIDA" from Rutasur, 14 Nov 02:00: In transit',
    ]);
  });
});

describe('noticesForShipment', () => {
  it('returns only the notices approved for that shipment', () => {
    const notices = [approvedNotice('shp-1'), approvedNotice('shp-other-account')];

    expect(noticesForShipment('shp-1', notices)).toEqual([approvedNotice('shp-1')]);
  });

  it('returns nothing while no notice has been approved', () => {
    expect(noticesForShipment('shp-1', [])).toEqual([]);
  });
});

describe('isNoticeApproved', () => {
  it('matches the notice to its shipment, leg and cause', () => {
    const notices = [approvedNotice('shp-1')];

    expect(isNoticeApproved(delay('reported', '2026-11-14T09:00:00Z'), notices)).toBe(true);
    expect(isNoticeApproved({ ...delay('reported', '2026-11-14T09:00:00Z'), legId: 'leg-sea' }, notices)).toBe(false);
  });
});

describe('isActionTaken', () => {
  const exception = delay('reported', '2026-11-14T09:00:00Z');

  it('counts a notify action as taken once its notice is approved', () => {
    expect(isActionTaken(exception, 'notify-customer', [], [])).toBe(false);
    expect(isActionTaken(exception, 'notify-customer', [approvedNotice('shp-1')], [])).toBe(true);
  });

  it('counts a request action as taken only when that same request is logged for the leg', () => {
    const request: LoggedRequest = { shipmentId: 'shp-1', legId: 'leg-road', action: 'contact-operator', requestedAt: '2026-11-14T10:00:00Z' };

    expect(isActionTaken(exception, 'contact-operator', [], [request])).toBe(true);
    expect(isActionTaken(exception, 'upload-document', [], [request])).toBe(false);
    expect(isActionTaken({ ...exception, legId: 'leg-sea' }, 'contact-operator', [], [request])).toBe(false);
  });
});
