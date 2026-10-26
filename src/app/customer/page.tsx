import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipments } from '@/data-access/shipments';
import { findCustomerAccountForParam } from '@/domain/viewer';
import { CustomerShipmentsLive } from '@/live/customer-shipments-live';
import { operators } from '@/mock/network';
import { customerAccounts } from '@/mock/viewers';

export default async function CustomerPage({ searchParams }: PageProps<'/customer'>) {
  const { account: accountParam } = await searchParams;
  const account = findCustomerAccountForParam(customerAccounts, accountParam);
  if (!account) notFound();

  const shipments = await fetchShipments({ role: 'customer', accountId: account.id });

  return (
    <AppShell
      activeView={{ role: 'customer', accountId: account.id }}
      perimeterLabel={`Customer · ${account.name}`}
    >
      <div className="flex flex-col gap-8">
        <h1 className="text-title">Your shipments</h1>
        <CustomerShipmentsLive shipments={shipments} accountId={account.id} operators={operators} />
      </div>
    </AppShell>
  );
}
