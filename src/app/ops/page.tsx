import { AppShell } from '@/components/shell/app-shell';
import { opsPerimeterLabel } from '@/mock/viewers';

export default function OpsPage() {
  return (
    <AppShell activeView={{ role: 'ops' }} perimeterLabel={`Operations · ${opsPerimeterLabel}`}>
      <h1 className="text-title">Exceptions</h1>
    </AppShell>
  );
}
