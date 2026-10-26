import { LegTimeline } from '@/components/timeline/leg-timeline';
import type { NormalisationSources } from '@/domain/normalise';
import type { Operator, Shipment, Site } from '@/domain/shipment';
import { ShipmentLink } from '@/components/shipment/shipment-link';

type ShipmentListProps = {
  shipments: Shipment[];
  sites: Site[];
  now: string;
  sources: NormalisationSources;
  operators: Operator[];
};

export function ShipmentList({ shipments, sites, now, sources, operators }: ShipmentListProps) {
  const siteName = (siteId: string) => sites.find(site => site.id === siteId)?.name ?? siteId;

  return (
    <section aria-labelledby="all-shipments-heading" className="flex flex-col gap-2">
      <h2 id="all-shipments-heading" className="text-heading">{`All shipments (${shipments.length})`}</h2>
      {shipments.length === 0
        ? <p className="py-4 text-body text-muted-foreground">No shipments for this site.</p>
        : (
            <ol className="border-t border-border">
              {shipments.map(shipment => (
                <li key={shipment.id} className="flex flex-col gap-2 border-b border-border py-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <ShipmentLink shipment={shipment} href={`/ops/shipments/${shipment.id}`} />
                    <span className="text-label text-muted-foreground">{`From ${siteName(shipment.originSiteId)}`}</span>
                  </div>
                  <LegTimeline shipment={shipment} now={now} sources={sources} role="ops" operators={operators} compact />
                </li>
              ))}
            </ol>
          )}
    </section>
  );
}
