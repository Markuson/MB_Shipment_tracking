import { cva } from 'class-variance-authority';
import { OctagonAlert, TriangleAlert } from 'lucide-react';
import type { CustomerAlert } from '@/domain/customer-alerts';
import { legTypeLabel } from '@/domain/leg-view';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';

export type CustomerAlertText = { title: string; confirmed: string; notConfirmed: string };

// Facts the carrier reported or the booking states, kept apart from what nobody has confirmed;
// it never offers a new delivery date.
export function customerAlertText(alert: CustomerAlert): CustomerAlertText {
  const legName = legTypeLabel[alert.legType].toLowerCase();
  const { fact } = alert;

  if (alert.cause === 'customs-hold') {
    return {
      title: 'Held by customs',
      confirmed: fact
        ? `Held by customs since ${formatDateTime(fact.reportedAt)}, as reported by the carrier.`
        : 'Held by customs, as reported by the carrier.',
      notConfirmed: 'when customs will release it, so there is no delivery date yet.',
    };
  }
  if (alert.basis === 'reported') {
    return {
      title: `Delayed on the ${legName} leg`,
      confirmed: fact
        ? `${fact.phrase}, reported by the carrier on ${formatDateTime(fact.reportedAt)}.`
        : 'The carrier reported a delay.',
      notConfirmed: 'a new delivery date.',
    };
  }
  const lastConfirmed = fact ? ` Last confirmed: ${fact.phrase.toLowerCase()}, ${formatDateTime(fact.reportedAt)}.` : '';
  return {
    title: `Behind schedule on the ${legName} leg`,
    confirmed: `This leg was planned to finish by ${formatDateTime(alert.plannedEnd)}.${lastConfirmed}`,
    notConfirmed: 'when it will finish. The carrier has not reported it yet.',
  };
}

const alertVariants = cva('flex gap-3 rounded border p-4', {
  variants: {
    cause: {
      'customs-hold': 'border-status-critical bg-status-critical-subtle',
      'delay': 'border-status-caution bg-status-caution-subtle',
    },
  },
});

const alertIcon = {
  'customs-hold': { icon: OctagonAlert, className: 'text-status-critical' },
  'delay': { icon: TriangleAlert, className: 'text-status-caution' },
};

type CustomerAlertBannerProps = {
  alerts: CustomerAlert[];
  // On the list, several shipments share one banner, so each alert names its shipment.
  showShipmentId: boolean;
};

export function CustomerAlertBanner({ alerts, showShipmentId }: CustomerAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <section aria-labelledby="customer-alerts-heading" className="flex flex-col gap-2">
      <h2 id="customer-alerts-heading" className="sr-only">Updates on your shipments</h2>
      <ul className="flex flex-col gap-2">
        {alerts.map((alert, alertIndex) => {
          const text = customerAlertText(alert);
          const { icon: AlertIcon, className } = alertIcon[alert.cause];
          return (
            <li key={`${alert.shipmentId}-${alertIndex}`} className={alertVariants({ cause: alert.cause })}>
              <AlertIcon aria-hidden="true" className={cn('mt-1 size-4 shrink-0', className)} />
              <div className="flex flex-col gap-1">
                <p className="text-body font-semibold">
                  {showShipmentId ? `${alert.shipmentId.toUpperCase()} · ${text.title}` : text.title}
                </p>
                <p className="text-label">{`Confirmed: ${text.confirmed}`}</p>
                <p className="text-label text-muted-foreground">{`Not confirmed yet: ${text.notConfirmed}`}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
