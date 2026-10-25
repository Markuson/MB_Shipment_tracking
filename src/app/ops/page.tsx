import { ExceptionList, type ExceptionRow } from '@/components/ops/exception-list';
import { ShipmentList } from '@/components/ops/shipment-list';
import { SiteFilterForm } from '@/components/ops/site-filter-form';
import { AppShell } from '@/components/shell/app-shell';
import { fetchShipments } from '@/data-access/shipments';
import { deriveExceptions, rankExceptions } from '@/domain/exceptions';
import { filterShipmentsBySite, parseSiteParam } from '@/domain/site-filter';
import { operators, sites } from '@/mock/network';
import { suggestedActionByCause } from '@/mock/next-actions';
import { mockNormalisationSources } from '@/mock/normalisation';
import { demoStartTime } from '@/mock/shipments';
import { opsPerimeterLabel } from '@/mock/viewers';

export default async function OpsPage({ searchParams }: PageProps<'/ops'>) {
  const { site: siteParam } = await searchParams;
  const siteSelection = parseSiteParam(siteParam);

  const shipments = filterShipmentsBySite(await fetchShipments({ role: 'ops' }), siteSelection);
  const exceptions = rankExceptions(
    shipments.flatMap(shipment => deriveExceptions(shipment, demoStartTime, mockNormalisationSources)),
  );
  const rows = exceptions.flatMap((exception): ExceptionRow[] => {
    const shipment = shipments.find(candidate => candidate.id === exception.shipmentId);
    if (!shipment) return [];
    return [{ exception, shipment, suggestedAction: suggestedActionByCause[exception.cause] }];
  });

  return (
    <AppShell activeView={{ role: 'ops' }} perimeterLabel={`Operations · ${opsPerimeterLabel}`}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-title">Operations</h1>
          <SiteFilterForm sites={sites} selectedSiteId={siteSelection.kind === 'site' ? siteSelection.siteId : undefined} />
        </div>
        <ExceptionList rows={rows} now={demoStartTime} sources={mockNormalisationSources} operators={operators} />
        <ShipmentList
          shipments={shipments}
          sites={sites}
          now={demoStartTime}
          sources={mockNormalisationSources}
          operators={operators}
        />
      </div>
    </AppShell>
  );
}
