import { describe, expect, it } from 'vitest';
import { deriveDeliveryOutlook } from './delivery-outlook';
import type { Reliability } from './shipment';

const promised = '2026-11-15T18:00:00Z';

function estimate(earliest: string, latest: string): Reliability<string> {
  return { kind: 'estimated', range: [earliest, latest], confidence: 'high', reasons: [] };
}

describe('deriveDeliveryOutlook', () => {
  it('is on time when the latest estimate is on the promised date', () => {
    const outlook = deriveDeliveryOutlook({ eta: estimate('2026-11-14T08:00:00Z', promised), promised, delivered: false });

    expect(outlook).toBe('on-time');
  });

  it('is a possible delay when the estimate straddles the promised date', () => {
    const eta = estimate('2026-11-14T08:00:00Z', '2026-11-17T08:00:00Z');

    const outlook = deriveDeliveryOutlook({ eta, promised, delivered: false });

    expect(outlook).toBe('possible-delay');
  });

  it('is delayed when even the earliest estimate is after the promised date', () => {
    const eta = estimate('2026-11-16T08:00:00Z', '2026-11-18T08:00:00Z');

    const outlook = deriveDeliveryOutlook({ eta, promised, delivered: false });

    expect(outlook).toBe('delayed');
  });

  it('awaits details instead of guessing when there is no estimate', () => {
    const outlook = deriveDeliveryOutlook({ eta: { kind: 'unknown' }, promised, delivered: false });

    expect(outlook).toBe('awaiting-details');
  });
});
