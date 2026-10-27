import { create } from 'zustand';
import { addHours } from '@/domain/leg-status';
import type { ApprovedNotice, LoggedRequest, NoticeDraft } from '@/domain/notice';
import type { InjectedReport } from '@/domain/operator-feed';
import type { OperatorEvent } from '@/domain/shipment';
import { demoStartTime } from '@/mock/demo-clock';

// Inputs only: everything on screen is derived from these by the domain functions.
type DemoInputs = {
  now: string;
  injectedEvents: OperatorEvent[];
  // Only approved notices are stored: a draft lives in the dialog, so the customer can never read one.
  approvedNotices: ApprovedNotice[];
  loggedRequests: LoggedRequest[];
};

type DemoActions = {
  injectEvent: (report: InjectedReport) => void;
  advanceClock: (hours: number) => void;
  approveNotice: (draft: NoticeDraft) => void;
  logRequest: (request: Omit<LoggedRequest, 'requestedAt'>) => void;
  reset: () => void;
};

const initialInputs: DemoInputs = { now: demoStartTime, injectedEvents: [], approvedNotices: [], loggedRequests: [] };

// Written only from click handlers in the browser, never during render or on the server,
// so the server's copy keeps the initial inputs every page is first rendered with.
export const useDemoStore = create<DemoInputs & DemoActions>()(set => ({
  ...initialInputs,
  // Stamped with the simulated clock, which only moves forward, so each leg's events stay in order.
  injectEvent: report => set(state => ({
    injectedEvents: [...state.injectedEvents, { ...report, reportedAt: state.now }],
  })),
  advanceClock: hours => set(state => ({ now: addHours(state.now, hours) })),
  // The basis is for ops to judge the draft; the customer receives only the approved text.
  approveNotice: ({ shipmentId, legId, cause, subject, text }) => set(state => ({
    approvedNotices: [...state.approvedNotices, { shipmentId, legId, cause, subject, text, approvedAt: state.now }],
  })),
  logRequest: request => set(state => ({
    loggedRequests: [...state.loggedRequests, { ...request, requestedAt: state.now }],
  })),
  reset: () => set(initialInputs),
}));
