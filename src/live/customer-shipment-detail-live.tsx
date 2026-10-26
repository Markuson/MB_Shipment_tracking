'use client';

import { CustomerAlertBanner } from '@/components/customer/customer-alert-banner';
import { DeliverySummary } from '@/components/customer/delivery-summary';
import { ShipmentDetail } from '@/components/shipment/shipment-detail';
import { deriveCustomerSummary } from '@/domain/customer-summary';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Operator, Shipment } from '@/domain/shipment';
import { mockNormalisationSources } from '@/mock/normalisation';
import { routeHistory } from '@/mock/route-history';
import { useDemoStore } from '@/store/demo-store';

type CustomerShipmentDetailLiveProps = {
  shipment: Shipment;
  operators: Operator[];
};

export function CustomerShipmentDetailLive({ shipment: fetchedShipment, operators }: CustomerShipmentDetailLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);

  const shipment = withOperatorEvents(fetchedShipment, injectedEvents);
  const summary = deriveCustomerSummary(shipment, now, mockNormalisationSources, routeHistory);

  return (
    <ShipmentDetail
      shipment={shipment}
      now={now}
      sources={mockNormalisationSources}
      role="customer"
      operators={operators}
      deliveryStatus={(
        <>
          <CustomerAlertBanner alerts={summary.alerts} showShipmentId={false} />
          <DeliverySummary summary={summary} showReasons />
        </>
      )}
    />
  );
}
