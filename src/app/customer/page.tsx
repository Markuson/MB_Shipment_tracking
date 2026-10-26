import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { findCustomerAccountForParam } from '@/domain/viewer';
import { customerAccounts } from '@/mock/viewers';

export default async function CustomerPage({ searchParams }: PageProps<'/customer'>) {
  const { account: accountParam } = await searchParams;
  const account = findCustomerAccountForParam(customerAccounts, accountParam);
  if (!account) notFound();

  return (
    <AppShell
      activeView={{ role: 'customer', accountId: account.id }}
      perimeterLabel={`Customer · ${account.name}`}
    >
      <h1 className="text-title">Your shipments</h1>
    </AppShell>
  );
}
