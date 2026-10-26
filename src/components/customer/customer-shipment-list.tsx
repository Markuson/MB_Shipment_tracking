import { ShipmentLink } from '@/components/shipment/shipment-link';
import { LegTimeline } from '@/components/timeline/leg-timeline';
import type { CustomerSummary } from '@/domain/customer-summary';
import type { NormalisationSources } from '@/domain/normalise';
import type { Operator, Shipment } from '@/domain/shipment';
import { CustomerAlertBanner } from './customer-alert-banner';
import { DeliverySummary } from './delivery-summary';

export type CustomerShipmentRow = { shipment: Shipment; summary: CustomerSummary };

type CustomerShipmentListProps = {
  rows: CustomerShipmentRow[];
  accountId: string;
  now: string;
  sources: NormalisationSources;
  operators: Operator[];
};

export function CustomerShipmentList({ rows, accountId, now, sources, operators }: CustomerShipmentListProps) {
  const alerts = rows.flatMap(row => row.summary.alerts);

  return (
    <div className="flex flex-col gap-6">
      <CustomerAlertBanner alerts={alerts} showShipmentId />
      {rows.length === 0
        ? <p className="py-4 text-body text-muted-foreground">No active shipments.</p>
        : (
            <ol aria-label="Your shipments" className="border-t border-border">
              {rows.map(({ shipment, summary }) => (
                <li key={shipment.id} className="flex flex-col gap-3 border-b border-border py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-8">
                    <ShipmentLink shipment={shipment} href={`/customer/shipments/${shipment.id}?account=${accountId}`} />
                    <DeliverySummary summary={summary} showReasons={false} />
                  </div>
                  <LegTimeline shipment={shipment} now={now} sources={sources} role="customer" operators={operators} compact />
                </li>
              ))}
            </ol>
          )}
    </div>
  );
}
