export type Account = { id: string; name: string; type: 'customer' | 'subsidiary' };
export type ActiveView = { role: 'ops' } | { role: 'customer'; accountId: string };

// A missing id is the demo's default entry point; an unknown id must never
// fall back to some other account, or a typo would leak that account's scope.
export function findCustomerAccount(accounts: Account[], accountId: string | undefined) {
  if (accountId === undefined) return accounts.at(0);
  return accounts.find(account => account.id === accountId);
}

// A repeated `?account=` is ambiguous, so it reads as unknown rather than falling back to the default.
export function findCustomerAccountForParam(accounts: Account[], accountParam: string | string[] | undefined) {
  if (Array.isArray(accountParam)) return undefined;
  return findCustomerAccount(accounts, accountParam);
}
