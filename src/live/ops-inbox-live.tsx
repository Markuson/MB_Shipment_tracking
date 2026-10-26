'use client';

import { ExceptionList, type ExceptionRow } from '@/components/ops/exception-list';
import { ShipmentList } from '@/components/ops/shipment-list';
import { deriveExceptions, rankExceptions } from '@/domain/exceptions';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Operator, Shipment, Site } from '@/domain/shipment';
import { suggestedActionByCause } from '@/mock/next-actions';
import { mockNormalisationSources } from '@/mock/normalisation';
import { useDemoStore } from '@/store/demo-store';

type OpsInboxLiveProps = {
  shipments: Shipment[];
  sites: Site[];
  operators: Operator[];
};

export function OpsInboxLive({ shipments: fetchedShipments, sites, operators }: OpsInboxLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);

  const shipments = fetchedShipments.map(shipment => withOperatorEvents(shipment, injectedEvents));
  const exceptions = rankExceptions(
    shipments.flatMap(shipment => deriveExceptions(shipment, now, mockNormalisationSources)),
  );
  const rows = exceptions.flatMap((exception): ExceptionRow[] => {
    const shipment = shipments.find(candidate => candidate.id === exception.shipmentId);
    if (!shipment) return [];
    return [{ exception, shipment, suggestedAction: suggestedActionByCause[exception.cause] }];
  });

  return (
    <>
      <ExceptionList rows={rows} now={now} sources={mockNormalisationSources} operators={operators} />
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
