import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { demoStartTime } from '@/mock/demo-clock';
import { operators } from '@/mock/network';
import { mockNormalisationSources } from '@/mock/normalisation';
import { mockShipments } from '@/mock/shipments';
import { ShipmentDetail } from './shipment-detail';

// Silent past its threshold (1004), under review (1005), and understood by rule (1002).
const customerVisibleCases = ['shp-1004', 'shp-1005', 'shp-1002'];

describe('ShipmentDetail for a customer', () => {
  it.each(customerVisibleCases)('never shows operator wording or ops warnings on %s', (shipmentId) => {
    const shipment = mockShipments.find(candidate => candidate.id === shipmentId);
    if (!shipment) throw new Error(`Mock shipment ${shipmentId} is missing`);

    const { container } = render(
      <ShipmentDetail
        shipment={shipment}
        now={demoStartTime}
        sources={mockNormalisationSources}
        role="customer"
        operators={operators}
      />,
    );

    const pageText = container.textContent ?? '';
    // Quoted, as the ops line shows it: some wording ("Out for delivery") is also a customer phrase.
    for (const event of shipment.legs.flatMap(leg => leg.events)) expect(pageText).not.toContain(`"${event.rawText}"`);
    expect(pageText).not.toMatch(/Operator wrote|No data for|No update within|Needs review|Proposed/);
  });
});
