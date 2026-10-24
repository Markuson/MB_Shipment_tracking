export type Account = { id: string; name: string; type: 'customer' | 'subsidiary' };

// A missing id is the demo's default entry point; an unknown id must never
// fall back to some other account, or a typo would leak that account's scope.
export function findCustomerAccount(accounts: Account[], accountId: string | undefined) {
  if (accountId === undefined) return accounts.at(0);
  return accounts.find(account => account.id === accountId);
}
