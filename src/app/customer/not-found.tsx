import { AppShell } from '@/components/shell/app-shell';

// Thrown by the customer pages for an unknown `?account=`. Rendered in the shell so the demo
// controls stay at hand to pick a real account, without falling back to someone else's scope.
export default function CustomerAccountNotFound() {
  return (
    <AppShell activeView={undefined} perimeterLabel="Customer · unknown account">
      <section className="flex flex-col gap-4">
        <h1 className="text-title">Account not found</h1>
        <p className="text-body text-muted-foreground">
          No customer account matches this link. Choose a view in the demo controls.
        </p>
      </section>
    </AppShell>
  );
}
