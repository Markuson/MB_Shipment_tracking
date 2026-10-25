import { notFound } from 'next/navigation';
import { ShipmentDetail } from '@/components/shipment/shipment-detail';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipment } from '@/data-access/shipments';
import { operators } from '@/mock/network';
import { mockNormalisationSources } from '@/mock/normalisation';
import { demoStartTime } from '@/mock/shipments';
import { opsPerimeterLabel } from '@/mock/viewers';

export default async function OpsShipmentPage({ params }: PageProps<'/ops/shipments/[id]'>) {
  const { id } = await params;
  const shipment = await fetchShipment({ role: 'ops' }, id);
  if (!shipment) notFound();

  return (
    <AppShell activeView={{ role: 'ops' }} perimeterLabel={`Operations · ${opsPerimeterLabel}`}>
      <ShipmentDetail
        shipment={shipment}
        now={demoStartTime}
        sources={mockNormalisationSources}
        role="ops"
        operators={operators}
      />
    </AppShell>
  );
}
