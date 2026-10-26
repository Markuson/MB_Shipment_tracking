import { describe, expect, it } from 'vitest';
import type { CustomerAlert } from '@/domain/customer-alerts';
import { customerAlertText } from './customer-alert-banner';

const reportedDelay: CustomerAlert = {
  shipmentId: 'shp-1',
  legType: 'sea',
  cause: 'delay',
  basis: 'reported',
  fact: { phrase: 'Delayed', reportedAt: '2026-11-14T12:00:00Z', operatorId: 'op-1' },
  plannedEnd: '2026-11-15T06:00:00Z',
};

describe('customerAlertText', () => {
  it('states the reported delay as confirmed and the new delivery date as not confirmed', () => {
    const text = customerAlertText(reportedDelay);

    expect(text.confirmed).toBe('Delayed, reported by the carrier on 14 Nov 13:00.');
    expect(text.notConfirmed).toBe('a new delivery date.');
  });

  it('never words a leg behind plan as a delay the carrier reported', () => {
    const behindPlan: CustomerAlert = {
      ...reportedDelay,
      basis: 'behind-plan',
      fact: { phrase: 'In transit', reportedAt: '2026-11-13T08:00:00Z', operatorId: 'op-1' },
    };

    const text = customerAlertText(behindPlan);

    expect(text.title).toBe('Behind schedule on the sea leg');
    expect(text.confirmed).not.toContain('reported');
    expect(text.notConfirmed).toContain('has not reported');
  });

  it('gives no delivery date for a customs hold', () => {
    const text = customerAlertText({ ...reportedDelay, legType: 'customs', cause: 'customs-hold' });

    expect(text.notConfirmed).toBe('when customs will release it, so there is no delivery date yet.');
  });
});
