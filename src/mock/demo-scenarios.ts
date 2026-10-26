import type { InjectedReport } from '@/domain/operator-feed';

export type DemoScenario = { id: string; label: string; report: InjectedReport };

// Each report uses wording the rule table already knows, so the existing domain functions
// produce the exception and the customer-facing change; nothing here decides an outcome.
export const demoScenarios: DemoScenario[] = [
  {
    id: 'port-delay',
    label: 'Port delay: SHP-1002 waits at anchor for a berth in Hamburg',
    report: { legId: 'shp-1002-sea', operatorId: 'op-oceanis', rawText: 'ANC' },
  },
];
