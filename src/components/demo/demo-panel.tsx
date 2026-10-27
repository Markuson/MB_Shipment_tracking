import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Account, ActiveView } from '@/domain/viewer';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';

type ViewLink = { key: string; href: string; label: string; isCurrent: boolean };

function buildViewLinks(accounts: Account[], activeView: ActiveView | undefined): ViewLink[] {
  const opsLink: ViewLink = {
    key: 'ops',
    href: '/ops',
    label: 'Operations',
    isCurrent: activeView?.role === 'ops',
  };
  const customerLinks = accounts.map(account => ({
    key: account.id,
    href: `/customer?account=${account.id}`,
    label: `Customer · ${account.name}`,
    isCurrent: activeView?.role === 'customer' && activeView.accountId === account.id,
  }));
  return [opsLink, ...customerLinks];
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export type ScenarioControl = { id: string; label: string; isReported: boolean };

type DemoPanelProps = {
  accounts: Account[];
  // Undefined when the link names no known viewer, so no view is marked as current.
  activeView: ActiveView | undefined;
  now: string;
  scenarios: ScenarioControl[];
  onReportScenario: (scenarioId: string) => void;
  onAdvanceClock: (hours: number) => void;
  onReset: () => void;
};

export function DemoPanel({
  accounts,
  activeView,
  now,
  scenarios,
  onReportScenario,
  onAdvanceClock,
  onReset,
}: DemoPanelProps) {
  const viewLinks = buildViewLinks(accounts, activeView);

  return (
    <aside aria-label="Demo controls" className="fixed inset-x-4 bottom-4 z-20 sm:left-auto sm:w-96">
      <details className="group rounded border border-border bg-surface">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center justify-between gap-2 rounded px-4 py-3 text-label',
            '[&::-webkit-details-marker]:hidden',
            focusRing,
          )}
        >
          <span>{`Demo controls · ${formatDateTime(now)}`}</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">▴</span>
        </summary>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto border-t border-border px-4 py-4">
          <p className="text-caption text-muted-foreground">
            Demo controls — not part of the product. Simulated time drives every status, warning and exception.
          </p>

          <nav aria-labelledby="demo-view-heading" className="flex flex-col gap-1">
            <h2 id="demo-view-heading" className="text-label">View as</h2>
            <ul>
              {viewLinks.map(viewLink => (
                <li key={viewLink.key}>
                  <Link
                    href={viewLink.href}
                    aria-current={viewLink.isCurrent ? 'page' : undefined}
                    className={cn(
                      'block rounded px-3 py-2 text-body hover:bg-muted',
                      'aria-[current=page]:bg-muted aria-[current=page]:font-semibold',
                      focusRing,
                    )}
                  >
                    {viewLink.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="demo-events-heading" className="flex flex-col gap-2">
            <h2 id="demo-events-heading" className="text-label">Operator reports</h2>
            {scenarios.map(scenario => (
              <div key={scenario.id} className="flex flex-col gap-1">
                <p className="text-caption text-muted-foreground">{scenario.label}</p>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={scenario.isReported}
                  onClick={() => onReportScenario(scenario.id)}
                >
                  {scenario.isReported ? 'Reported' : 'Report it now'}
                </Button>
              </div>
            ))}
          </section>

          <section aria-labelledby="demo-clock-heading" className="flex flex-col gap-2">
            <h2 id="demo-clock-heading" className="text-label">{`Simulated time: ${formatDateTime(now)}`}</h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => onAdvanceClock(6)}>+6 hours</Button>
              <Button type="button" variant="secondary" onClick={() => onAdvanceClock(24)}>+1 day</Button>
              <Button type="button" variant="secondary" onClick={onReset}>Reset demo</Button>
            </div>
          </section>
        </div>
      </details>
    </aside>
  );
}
