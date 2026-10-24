import type { ReactNode } from 'react';
import { customerAccounts } from '@/mock/viewers';
import type { ActiveView } from '@/domain/viewer';
import { DemoSwitcher } from './demo-switcher';

type AppShellProps = {
  activeView: ActiveView;
  perimeterLabel: string;
  children: ReactNode;
};

export function AppShell({ activeView, perimeterLabel, children }: AppShellProps) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2 text-heading">
            <span aria-hidden="true" className="size-3 rounded bg-brand" />
            Mars Industries
          </span>
          <DemoSwitcher accounts={customerAccounts} activeView={activeView} />
        </div>
      </header>
      <p className="border-b border-border bg-muted">
        <span className="mx-auto block max-w-6xl px-4 py-2 text-label text-muted-foreground sm:px-6">
          {`Demo: viewing as ${perimeterLabel}`}
        </span>
      </p>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
