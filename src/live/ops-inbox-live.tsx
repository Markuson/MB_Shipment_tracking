'use client';

import { ExceptionList, type ExceptionRow } from '@/components/ops/exception-list';
import { ShipmentList } from '@/components/ops/shipment-list';
import { deriveExceptions, rankExceptions, type ShipmentException } from '@/domain/exceptions';
import type { NextAction } from '@/domain/next-action';
import {
  draftNotice,
  isNoticeApproved,
  isRequestLogged,
  type ApprovedNotice,
  type LoggedRequest,
  type RequestAction,
} from '@/domain/notice';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Operator, Shipment, Site } from '@/domain/shipment';
import { noticeTemplateByCause, suggestedActionByCause } from '@/mock/next-actions';
import { mockNormalisationSources } from '@/mock/normalisation';
import { useDemoStore } from '@/store/demo-store';

type OpsInboxLiveProps = {
  shipments: Shipment[];
  sites: Site[];
  operators: Operator[];
};

function isHandled(
  exception: ShipmentException,
  action: NextAction,
  approvedNotices: ApprovedNotice[],
  loggedRequests: LoggedRequest[],
) {
  if (action === 'notify-customer') return isNoticeApproved(exception, approvedNotices);
  return isRequestLogged(exception, action, loggedRequests);
}

export function OpsInboxLive({ shipments: fetchedShipments, sites, operators }: OpsInboxLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);
  const approvedNotices = useDemoStore(state => state.approvedNotices);
  const loggedRequests = useDemoStore(state => state.loggedRequests);
  const approveNotice = useDemoStore(state => state.approveNotice);
  const logRequest = useDemoStore(state => state.logRequest);

  const shipments = fetchedShipments.map(shipment => withOperatorEvents(shipment, injectedEvents));
  const exceptions = rankExceptions(
    shipments.flatMap(shipment => deriveExceptions(shipment, now, mockNormalisationSources)),
  );
  const rows = exceptions.flatMap((exception): ExceptionRow[] => {
    const shipment = shipments.find(candidate => candidate.id === exception.shipmentId);
    if (!shipment) return [];
    const suggestedAction = suggestedActionByCause[exception.cause];
    const template = suggestedAction === 'notify-customer' && exception.cause !== 'needs-review'
      ? noticeTemplateByCause[exception.cause]
      : undefined;
    const draft = template && draftNotice(exception, shipment, template, mockNormalisationSources, operators);
    return [{
      exception,
      shipment,
      suggestedAction,
      draft,
      isHandled: isHandled(exception, suggestedAction, approvedNotices, loggedRequests),
    }];
  });

  function logRequestFor(exception: ShipmentException, action: RequestAction) {
    logRequest({ shipmentId: exception.shipmentId, legId: exception.legId, action });
  }

  return (
    <>
      <ExceptionList
        rows={rows}
        now={now}
        sources={mockNormalisationSources}
        operators={operators}
        onApproveNotice={approveNotice}
        onLogRequest={logRequestFor}
      />
      <ShipmentList
        shipments={shipments}
        sites={sites}
        now={now}
        sources={mockNormalisationSources}
        operators={operators}
      />
    </>
  );
}
