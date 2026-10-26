import { SiteFilterForm } from '@/components/ops/site-filter-form';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipments } from '@/data-access/shipments';
import { filterShipmentsBySite, parseSiteParam } from '@/domain/site-filter';
import { OpsInboxLive } from '@/live/ops-inbox-live';
import { operators, sites } from '@/mock/network';
import { opsPerimeterLabel } from '@/mock/viewers';

export default async function OpsPage({ searchParams }: PageProps<'/ops'>) {
  const { site: siteParam } = await searchParams;
  const siteSelection = parseSiteParam(siteParam);
  const shipments = filterShipmentsBySite(await fetchShipments({ role: 'ops' }), siteSelection);

  return (
    <AppShell activeView={{ role: 'ops' }} perimeterLabel={`Operations · ${opsPerimeterLabel}`}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-title">Operations</h1>
          <SiteFilterForm sites={sites} selectedSiteId={siteSelection.kind === 'site' ? siteSelection.siteId : undefined} />
        </div>
        <OpsInboxLive shipments={shipments} sites={sites} operators={operators} />
      </div>
    </AppShell>
  );
}
