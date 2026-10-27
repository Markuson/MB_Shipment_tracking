import { OctagonAlert, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import { LegTimeline } from '@/components/timeline/leg-timeline';
import type { ExceptionCause, ShipmentException } from '@/domain/exceptions';
import { hoursBetween } from '@/domain/leg-status';
import { legTypeLabel } from '@/domain/leg-view';
import type { NextAction } from '@/domain/next-action';
import type { NoticeDraft, RequestAction } from '@/domain/notice';
import type { NormalisationSources } from '@/domain/normalise';
import type { Operator, Shipment } from '@/domain/shipment';
import { formatDateTime, formatWaitingTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import { ShipmentLink } from '@/components/shipment/shipment-link';
import { ExceptionAction } from './exception-action';

export type ExceptionRow = {
  exception: ShipmentException;
  shipment: Shipment;
  suggestedAction: NextAction;
  // Only for a notify action: the draft ops review before anything reaches the customer.
  draft?: NoticeDraft;
  isHandled: boolean;
};

type ExceptionHandlers = {
  onApproveNotice: (draft: NoticeDraft) => void;
  onLogRequest: (exception: ShipmentException, action: RequestAction) => void;
};

const causeLabel: Record<ExceptionCause, string> = {
  'customs-hold': 'Customs hold',
  'delay': 'Delay',
  'silent-operator': 'No data from operator',
  'needs-review': 'Status needs review',
};

type Marker = { icon: LucideIcon; label: string; className: string };

// A status to review depends on an AI inference, so it takes the AI colour, not its severity's.
function exceptionMarker(exception: ShipmentException): Marker {
  if (exception.cause === 'needs-review') return { icon: Sparkles, label: 'Needs review', className: 'text-status-ai' };
  if (exception.severity === 'critical') return { icon: OctagonAlert, label: 'Critical', className: 'text-status-critical' };
  return { icon: TriangleAlert, label: 'Caution', className: 'text-status-caution' };
}

function exceptionHeadline({ exception, shipment }: ExceptionRow) {
  const leg = shipment.legs.find(candidate => candidate.id === exception.legId);
  if (!leg) return causeLabel[exception.cause];
  return `${causeLabel[exception.cause]} · ${legTypeLabel[leg.type]} leg`;
}

type ExceptionListItemProps = ExceptionHandlers & {
  row: ExceptionRow;
  now: string;
  sources: NormalisationSources;
  operators: Operator[];
};

function ExceptionListItem({ row, now, sources, operators, onApproveNotice, onLogRequest }: ExceptionListItemProps) {
  const { icon: MarkerIcon, label, className } = exceptionMarker(row.exception);
  const waitedHours = hoursBetween(row.exception.since, now);

  return (
    <li className="flex flex-col gap-4 border-b border-border py-4 md:flex-row md:items-center md:justify-between md:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-body">
          <span className={cn('flex items-center gap-1 text-label', className)}>
            <MarkerIcon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </span>
          <span className="font-semibold">{exceptionHeadline(row)}</span>
        </p>
        <ShipmentLink shipment={row.shipment} href={`/ops/shipments/${row.shipment.id}`} />
        <LegTimeline shipment={row.shipment} now={now} sources={sources} role="ops" operators={operators} compact />
        <p className="text-caption text-muted-foreground">
          {`Waiting ${formatWaitingTime(waitedHours)}, since ${formatDateTime(row.exception.since)}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1 md:items-end">
        <ExceptionAction
          suggestedAction={row.suggestedAction}
          draft={row.draft}
          isHandled={row.isHandled}
          onApproveNotice={onApproveNotice}
          onLogRequest={action => onLogRequest(row.exception, action)}
        />
      </div>
    </li>
  );
}

type ExceptionListProps = ExceptionHandlers & {
  rows: ExceptionRow[];
  now: string;
  sources: NormalisationSources;
  operators: Operator[];
};

export function ExceptionList({ rows, now, sources, operators, onApproveNotice, onLogRequest }: ExceptionListProps) {
  return (
    <section aria-labelledby="exceptions-heading" className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 id="exceptions-heading" className="text-heading">{`Exceptions · ${rows.length} need attention`}</h2>
        <p className="text-caption text-muted-foreground">{`As of ${formatDateTime(now)}`}</p>
      </div>
      {rows.length === 0
        ? <p className="py-4 text-body text-muted-foreground">No exceptions on your sites.</p>
        : (
            <ol className="border-t border-border">
              {rows.map(row => (
                <ExceptionListItem
                  key={`${row.exception.shipmentId}-${row.exception.legId}`}
                  row={row}
                  now={now}
                  sources={sources}
                  operators={operators}
                  onApproveNotice={onApproveNotice}
                  onLogRequest={onLogRequest}
                />
              ))}
            </ol>
          )}
    </section>
  );
}
