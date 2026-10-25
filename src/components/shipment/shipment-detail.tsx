import type { ViewerRole } from '@/domain/leg-view';
import type { NormalisationSources } from '@/domain/normalise';
import type { Operator, Shipment } from '@/domain/shipment';
import { formatDay } from '@/lib/format-date';
import { LegTimeline } from '@/components/timeline/leg-timeline';

type ShipmentDetailProps = {
  shipment: Shipment;
  now: string;
  sources: NormalisationSources;
  role: ViewerRole;
  operators: Operator[];
};

export function ShipmentDetail({ shipment, now, sources, role, operators }: ShipmentDetailProps) {
  const { destination } = shipment;
  // The booking of the last leg is the delivery promise: a commitment, not a fact or an estimate.
  const promisedDelivery = shipment.legs.at(-1)?.planned.end;

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-title">{`${shipment.id.toUpperCase()} → ${destination.city}, ${destination.country}`}</h1>
        {promisedDelivery && (
          <p className="text-label text-muted-foreground">{`Promised ${formatDay(promisedDelivery)}`}</p>
        )}
      </header>
      <section aria-labelledby="route-heading" className="flex flex-col gap-4">
        <h2 id="route-heading" className="text-heading">Route</h2>
        {shipment.legs.length === 0
          ? <p className="text-body text-muted-foreground">No leg data yet.</p>
          : <LegTimeline shipment={shipment} now={now} sources={sources} role={role} operators={operators} />}
      </section>
    </article>
  );
}
