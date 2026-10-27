import { describe, expect, it } from 'vitest';
import type { NoticeDraft } from '@/domain/notice';
import { demoStartTime } from '@/mock/demo-clock';
import { useDemoStore } from './demo-store';

const report = { legId: 'shp-1002-sea', rawText: 'ANC', operatorId: 'op-oceanis' };

const draft: NoticeDraft = {
  shipmentId: 'shp-1002',
  legId: 'shp-1002-sea',
  cause: 'delay',
  subject: 'Your shipment is delayed',
  text: 'Delayed at sea.',
  basedOn: ['"ANC" from Oceanis'],
};

describe('demo store', () => {
  it('stamps an injected report with the simulated clock, not the real one', () => {
    useDemoStore.getState().reset();
    useDemoStore.getState().advanceClock(6);

    useDemoStore.getState().injectEvent(report);

    expect(useDemoStore.getState().injectedEvents).toEqual([{ ...report, reportedAt: '2026-11-14T18:00:00.000Z' }]);
  });

  it('stamps an approved notice with the simulated clock and keeps only the approved text', () => {
    useDemoStore.getState().reset();
    useDemoStore.getState().advanceClock(6);

    useDemoStore.getState().approveNotice(draft);

    expect(useDemoStore.getState().approvedNotices).toEqual([{
      shipmentId: 'shp-1002',
      legId: 'shp-1002-sea',
      cause: 'delay',
      subject: 'Your shipment is delayed',
      text: 'Delayed at sea.',
      approvedAt: '2026-11-14T18:00:00.000Z',
    }]);
  });

  it('returns to the seed clock and drops reports, notices and requests on reset', () => {
    useDemoStore.getState().reset();
    useDemoStore.getState().advanceClock(24);
    useDemoStore.getState().injectEvent(report);
    useDemoStore.getState().approveNotice(draft);
    useDemoStore.getState().logRequest({ shipmentId: 'shp-1003', legId: 'shp-1003-customs', action: 'upload-document' });

    useDemoStore.getState().reset();

    expect(useDemoStore.getState()).toMatchObject({
      now: demoStartTime,
      injectedEvents: [],
      approvedNotices: [],
      loggedRequests: [],
    });
  });
});
