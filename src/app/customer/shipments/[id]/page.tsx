import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipment } from '@/data-access/shipments';
import { findCustomerAccountForParam, type ActiveView } from '@/domain/viewer';
import { ShipmentDetailLive } from '@/live/shipment-detail-live';
import { operators } from '@/mock/network';
import { customerAccounts } from '@/mock/viewers';

export default async function CustomerShipmentPage({ params, searchParams }: PageProps<'/customer/shipments/[id]'>) {
  const { id } = await params;
  const { account: accountParam } = await searchParams;
  const account = findCustomerAccountForParam(customerAccounts, accountParam);
  if (!account) notFound();

  const activeView: ActiveView = { role: 'customer', accountId: account.id };
  const shipment = await fetchShipment(activeView, id);
  if (!shipment) notFound();

  return (
    <AppShell activeView={activeView} perimeterLabel={`Customer · ${account.name}`}>
      <ShipmentDetailLive shipment={shipment} role="customer" operators={operators} />
    </AppShell>
  );
}
