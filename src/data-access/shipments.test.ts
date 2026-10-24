import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchShipment, fetchShipments } from './shipments';

const maximumLatencyMilliseconds = 500;

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchShipments', () => {
  it('gives a customer only the shipments of their own account', async () => {
    vi.useFakeTimers();

    const request = fetchShipments({ role: 'customer', accountId: 'acc-rhone' });
    await vi.advanceTimersByTimeAsync(maximumLatencyMilliseconds);
    const shipments = await request;

    expect(shipments.length).toBeGreaterThan(0);
    expect(shipments.every(shipment => shipment.accountId === 'acc-rhone')).toBe(true);
  });
});

describe('fetchShipment', () => {
  it('reports a shipment of another account as not found', async () => {
    vi.useFakeTimers();

    const request = fetchShipment({ role: 'customer', accountId: 'acc-rhone' }, 'shp-1002');
    await vi.advanceTimersByTimeAsync(maximumLatencyMilliseconds);
    const shipment = await request;

    expect(shipment).toBeUndefined();
  });
});
