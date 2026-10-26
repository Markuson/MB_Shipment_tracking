import { create } from 'zustand';
import { addHours } from '@/domain/leg-status';
import type { InjectedReport } from '@/domain/operator-feed';
import type { OperatorEvent } from '@/domain/shipment';
import { demoStartTime } from '@/mock/demo-clock';

// Inputs only: everything on screen is derived from these by the domain functions.
type DemoInputs = {
  now: string;
  injectedEvents: OperatorEvent[];
};

type DemoActions = {
  injectEvent: (report: InjectedReport) => void;
  advanceClock: (hours: number) => void;
  reset: () => void;
};

const initialInputs: DemoInputs = { now: demoStartTime, injectedEvents: [] };

// Written only from click handlers in the browser, never during render or on the server,
// so the server's copy keeps the initial inputs every page is first rendered with.
export const useDemoStore = create<DemoInputs & DemoActions>()(set => ({
  ...initialInputs,
  // Stamped with the simulated clock, which only moves forward, so each leg's events stay in order.
  injectEvent: report => set(state => ({
    injectedEvents: [...state.injectedEvents, { ...report, reportedAt: state.now }],
  })),
  advanceClock: hours => set(state => ({ now: addHours(state.now, hours) })),
  reset: () => set(initialInputs),
}));
