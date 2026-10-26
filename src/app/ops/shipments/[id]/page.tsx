import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipment } from '@/data-access/shipments';
import { ShipmentDetailLive } from '@/live/shipment-detail-live';
import { operators } from '@/mock/network';
import { opsPerimeterLabel } from '@/mock/viewers';

export default async function OpsShipmentPage({ params }: PageProps<'/ops/shipments/[id]'>) {
  const { id } = await params;
  const shipment = await fetchShipment({ role: 'ops' }, id);
  if (!shipment) notFound();

  return (
    <AppShell activeView={{ role: 'ops' }} perimeterLabel={`Operations · ${opsPerimeterLabel}`}>
      <ShipmentDetailLive shipment={shipment} role="ops" operators={operators} />
    </AppShell>
  );
}
