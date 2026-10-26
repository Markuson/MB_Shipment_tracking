'use client';

import { CustomerShipmentList } from '@/components/customer/customer-shipment-list';
import { deriveCustomerSummary } from '@/domain/customer-summary';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Operator, Shipment } from '@/domain/shipment';
import { mockNormalisationSources } from '@/mock/normalisation';
import { routeHistory } from '@/mock/route-history';
import { useDemoStore } from '@/store/demo-store';

type CustomerShipmentsLiveProps = {
  shipments: Shipment[];
  accountId: string;
  operators: Operator[];
};

export function CustomerShipmentsLive({ shipments, accountId, operators }: CustomerShipmentsLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);

  const rows = shipments.map((fetchedShipment) => {
    const shipment = withOperatorEvents(fetchedShipment, injectedEvents);
    return { shipment, summary: deriveCustomerSummary(shipment, now, mockNormalisationSources, routeHistory) };
  });

  return (
    <CustomerShipmentList
      rows={rows}
      accountId={accountId}
      now={now}
      sources={mockNormalisationSources}
      operators={operators}
    />
  );
}
