import Link from 'next/link';
import type { Account, ActiveView } from '@/domain/viewer';
import { cn } from '@/lib/cn';

type ViewLink = { key: string; href: string; label: string; isCurrent: boolean };

function buildViewLinks(accounts: Account[], activeView: ActiveView): ViewLink[] {
  const opsLink: ViewLink = {
    key: 'ops',
    href: '/ops',
    label: 'Operations',
    isCurrent: activeView.role === 'ops',
  };
  const customerLinks = accounts.map(account => ({
    key: account.id,
    href: `/customer?account=${account.id}`,
    label: `Customer · ${account.name}`,
    isCurrent: activeView.role === 'customer' && activeView.accountId === account.id,
  }));
  return [opsLink, ...customerLinks];
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

type DemoSwitcherProps = {
  accounts: Account[];
  activeView: ActiveView;
};

export function DemoSwitcher({ accounts, activeView }: DemoSwitcherProps) {
  const viewLinks = buildViewLinks(accounts, activeView);

  return (
    <details className="group relative">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-1 rounded px-3 py-2 text-label hover:bg-muted',
          '[&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        Demo
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <nav
        aria-label="Demo views"
        className="absolute right-0 z-10 mt-2 w-72 rounded border border-border bg-surface p-2"
      >
        <p className="px-3 pt-1 pb-2 text-caption text-muted-foreground">View as (demo only, not part of the product)</p>
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
    </details>
  );
}
