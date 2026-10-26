'use client';

import { ShipmentDetail } from '@/components/shipment/shipment-detail';
import type { ViewerRole } from '@/domain/leg-view';
import { withOperatorEvents } from '@/domain/operator-feed';
import type { Operator, Shipment } from '@/domain/shipment';
import { mockNormalisationSources } from '@/mock/normalisation';
import { useDemoStore } from '@/store/demo-store';

type ShipmentDetailLiveProps = {
  shipment: Shipment;
  role: ViewerRole;
  operators: Operator[];
};

export function ShipmentDetailLive({ shipment, role, operators }: ShipmentDetailLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);

  return (
    <ShipmentDetail
      shipment={withOperatorEvents(shipment, injectedEvents)}
      now={now}
      sources={mockNormalisationSources}
      role={role}
      operators={operators}
    />
  );
}
