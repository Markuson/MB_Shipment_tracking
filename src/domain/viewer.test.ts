import { describe, expect, it } from 'vitest';
import { findCustomerAccount, type Account } from './viewer';

const accounts: Account[] = [
  { id: 'acc-external', name: 'External customer', type: 'customer' },
  { id: 'acc-subsidiary', name: 'Subsidiary', type: 'subsidiary' },
];

describe('findCustomerAccount', () => {
  it('returns the requested account', () => {
    const account = findCustomerAccount(accounts, 'acc-subsidiary');

    expect(account?.id).toBe('acc-subsidiary');
  });

  it('defaults to the first account when no id is given', () => {
    const account = findCustomerAccount(accounts, undefined);

    expect(account?.id).toBe('acc-external');
  });

  it('returns nothing for an unknown id instead of another account', () => {
    const account = findCustomerAccount(accounts, 'acc-unknown');

    expect(account).toBeUndefined();
  });
});
