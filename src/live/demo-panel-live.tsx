'use client';

import { DemoPanel } from '@/components/demo/demo-panel';
import type { Account, ActiveView } from '@/domain/viewer';
import { demoScenarios } from '@/mock/demo-scenarios';
import { useDemoStore } from '@/store/demo-store';

type DemoPanelLiveProps = {
  accounts: Account[];
  activeView: ActiveView;
};

export function DemoPanelLive({ accounts, activeView }: DemoPanelLiveProps) {
  const now = useDemoStore(state => state.now);
  const injectedEvents = useDemoStore(state => state.injectedEvents);
  const injectEvent = useDemoStore(state => state.injectEvent);
  const advanceClock = useDemoStore(state => state.advanceClock);
  const reset = useDemoStore(state => state.reset);

  // Reporting the same wording twice would only repeat the event, so a reported scenario is disabled.
  const scenarios = demoScenarios.map(scenario => ({
    id: scenario.id,
    label: scenario.label,
    isReported: injectedEvents.some(
      event => event.legId === scenario.report.legId && event.rawText === scenario.report.rawText,
    ),
  }));

  function reportScenario(scenarioId: string) {
    const scenario = demoScenarios.find(candidate => candidate.id === scenarioId);
    if (scenario) injectEvent(scenario.report);
  }

  return (
    <DemoPanel
      accounts={accounts}
      activeView={activeView}
      now={now}
      scenarios={scenarios}
      onReportScenario={reportScenario}
      onAdvanceClock={advanceClock}
      onReset={reset}
    />
  );
}
