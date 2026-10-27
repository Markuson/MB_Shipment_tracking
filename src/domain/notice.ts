import type { ExceptionCause, ShipmentException } from './exceptions';
import { legTypeLabel } from './leg-view';
import type { NextAction, NoticeTemplate } from './next-action';
import { normalise, type NormalisationSources } from './normalise';
import type { Operator, Shipment } from './shipment';
import { statusPhrase } from './vocabulary';
import { formatDateTime } from '@/lib/format-date';

export type NoticeDraft = {
  shipmentId: string;
  legId: string;
  cause: ExceptionCause;
  subject: string;
  text: string;
  // Ops only: what the draft rests on, so they can judge it before it reaches the customer.
  basedOn: string[];
};

export type ApprovedNotice = Omit<NoticeDraft, 'basedOn'> & { approvedAt: string };

// The actions that only record a request: nothing is drafted, so there is nothing to approve.
export type RequestAction = Exclude<NextAction, 'notify-customer'>;

export type LoggedRequest = {
  shipmentId: string;
  legId: string;
  action: RequestAction;
  requestedAt: string;
};

function operatorName(operators: Operator[], operatorId: string) {
  return operators.find(operator => operator.id === operatorId)?.name ?? operatorId;
}

// Cites only what exists: a reported event, or the booking when the leg is late with no report of a delay.
function findBasis(
  exception: ShipmentException,
  shipment: Shipment,
  sources: NormalisationSources,
  operators: Operator[],
) {
  const leg = shipment.legs.find(candidate => candidate.id === exception.legId);
  if (!leg) return [];

  const latestEvent = leg.events.at(-1);
  const eventBasis = latestEvent
    ? [`"${latestEvent.rawText}" from ${operatorName(operators, latestEvent.operatorId)}, ${formatDateTime(latestEvent.reportedAt)}: ${statusPhrase(leg.type, normalise(latestEvent, sources).code)}`]
    : [];
  if (exception.basis !== 'behind-plan') return eventBasis;
  return [`Booking: ${legTypeLabel[leg.type].toLowerCase()} leg planned to finish by ${formatDateTime(leg.planned.end)}`, ...eventBasis];
}

export function draftNotice(
  exception: ShipmentException,
  shipment: Shipment,
  template: NoticeTemplate,
  sources: NormalisationSources,
  operators: Operator[],
): NoticeDraft | undefined {
  const leg = shipment.legs.find(candidate => candidate.id === exception.legId);
  if (!leg) return undefined;

  return {
    shipmentId: shipment.id,
    legId: leg.id,
    cause: exception.cause,
    subject: template.subject,
    text: template.draftBody({
      destinationCity: shipment.destination.city,
      legPhrase: `${legTypeLabel[leg.type].toLowerCase()} leg`,
      formattedSince: formatDateTime(exception.since),
    }),
    basedOn: findBasis(exception, shipment, sources, operators),
  };
}

export function isNoticeApproved(exception: ShipmentException, notices: ApprovedNotice[]) {
  return notices.some(notice => notice.shipmentId === exception.shipmentId
    && notice.legId === exception.legId
    && notice.cause === exception.cause);
}

export function isRequestLogged(exception: ShipmentException, action: RequestAction, requests: LoggedRequest[]) {
  return requests.some(request => request.shipmentId === exception.shipmentId
    && request.legId === exception.legId
    && request.action === action);
}

// Taking the suggested action records that someone acted, not that the problem is gone.
export function isActionTaken(
  exception: ShipmentException,
  action: NextAction,
  notices: ApprovedNotice[],
  requests: LoggedRequest[],
) {
  if (action === 'notify-customer') return isNoticeApproved(exception, notices);
  return isRequestLogged(exception, action, requests);
}

// The store only ever holds approved notices, so a draft never reaches this.
export function noticesForShipment(shipmentId: string, notices: ApprovedNotice[]) {
  return notices.filter(notice => notice.shipmentId === shipmentId);
}
