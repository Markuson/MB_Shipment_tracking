import { describe, expect, it } from 'vitest';
import { demoStartTime } from '@/mock/demo-clock';
import { useDemoStore } from './demo-store';

const report = { legId: 'shp-1002-sea', rawText: 'ANC', operatorId: 'op-oceanis' };

describe('demo store', () => {
  it('stamps an injected report with the simulated clock, not the real one', () => {
    useDemoStore.getState().reset();
    useDemoStore.getState().advanceClock(6);

    useDemoStore.getState().injectEvent(report);

    expect(useDemoStore.getState().injectedEvents).toEqual([{ ...report, reportedAt: '2026-11-14T18:00:00.000Z' }]);
  });

  it('returns to the seed clock and drops injected reports on reset', () => {
    useDemoStore.getState().reset();
    useDemoStore.getState().advanceClock(24);
    useDemoStore.getState().injectEvent(report);

    useDemoStore.getState().reset();

    expect(useDemoStore.getState()).toMatchObject({ now: demoStartTime, injectedEvents: [] });
  });
});
