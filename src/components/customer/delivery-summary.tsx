import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { CustomerSummary, DeliveryBlocker } from '@/domain/customer-summary';
import { deliveryOutlookLabels, type DeliveryOutlook } from '@/domain/delivery-outlook';
import type { Reliability } from '@/domain/shipment';
import { formatDateTime, formatDay } from '@/lib/format-date';
import { cn } from '@/lib/cn';

type Appearance = { label: string; icon: LucideIcon; className: string };

const outlookAppearance: Record<DeliveryOutlook, Appearance> = {
  'on-time': { label: deliveryOutlookLabels['on-time'], icon: ArrowRight, className: 'text-status-confirmed' },
  'delivered': { label: deliveryOutlookLabels.delivered, icon: CircleCheck, className: 'text-status-confirmed' },
  'possible-delay': { label: deliveryOutlookLabels['possible-delay'], icon: TriangleAlert, className: 'text-status-caution' },
  'delayed': { label: deliveryOutlookLabels.delayed, icon: OctagonAlert, className: 'text-status-critical' },
  'awaiting-details': {
    label: deliveryOutlookLabels['awaiting-details'],
    icon: CircleDashed,
    className: 'text-muted-foreground',
  },
};

// With no date to compare, the reason the customer already sees in an alert replaces "awaiting details".
const blockerAppearance: Record<DeliveryBlocker, Appearance> = {
  'held-by-customs': { label: 'Held by customs', icon: OctagonAlert, className: 'text-status-critical' },
  'delayed': { label: 'Delayed', icon: TriangleAlert, className: 'text-status-caution' },
  'behind-schedule': { label: 'Behind schedule', icon: TriangleAlert, className: 'text-status-caution' },
};

function estimatedRangeText(range: [string, string]) {
  const [earliest, latest] = range;
  const earliestDay = formatDay(earliest);
  const latestDay = formatDay(latest);
  return earliestDay === latestDay ? `Estimated ${earliestDay}` : `Estimated ${earliestDay} – ${latestDay}`;
}

export function etaText(eta: Reliability<string>, blocker: DeliveryBlocker | undefined) {
  if (eta.kind === 'confirmed') return `Delivered ${formatDateTime(eta.value)}`;
  if (eta.kind === 'estimated') return estimatedRangeText(eta.range);
  if (blocker) return `Delivery date not available: ${blockerAppearance[blocker].label.toLowerCase()}`;
  return 'Delivery date: awaiting details from operator';
}

type DeliverySummaryProps = {
  summary: CustomerSummary;
  // The detail page has room for the basis of the estimate; a list row keeps only its label.
  showReasons: boolean;
};

export function DeliverySummary({ summary, showReasons }: DeliverySummaryProps) {
  const { eta, outlook, promised, blocker } = summary;
  const { label, icon: StatusIcon, className } = blocker ? blockerAppearance[blocker] : outlookAppearance[outlook];

  return (
    <div className="flex flex-col gap-1">
      <p className={cn('flex items-center gap-2 text-body font-semibold', className)}>
        <StatusIcon aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label">
        <span>{etaText(eta, blocker)}</span>
        {promised && eta.kind !== 'confirmed' && (
          <span className="text-muted-foreground">{`· Promised ${formatDay(promised)}`}</span>
        )}
        {eta.kind === 'estimated' && (
          <span className="rounded bg-muted px-2 text-caption text-muted-foreground">Simulated route history</span>
        )}
      </p>
      {showReasons && eta.kind === 'estimated' && eta.reasons.map(reason => (
        <p key={reason} className="text-caption text-muted-foreground">{`Based on simulated route history: ${reason}`}</p>
      ))}
    </div>
  );
}
