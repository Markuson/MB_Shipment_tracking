import { cva } from 'class-variance-authority';
import {
  Anchor,
  ArrowRight,
  CircleCheck,
  CircleDashed,
  Landmark,
  OctagonAlert,
  Package,
  Ship,
  Sparkles,
  TriangleAlert,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import {
  deriveLegView,
  legTypeLabel,
  type LegLine,
  type LegView,
  type OperatorReport,
  type ViewerRole,
} from '@/domain/leg-view';
import type { NormalisationSources } from '@/domain/normalise';
import type { LegType, Operator, Shipment } from '@/domain/shipment';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';

const legLineVariants = cva('h-0 flex-1 border-t-4', {
  variants: {
    line: {
      solid: 'border-status-confirmed',
      dashed: 'border-dashed border-status-confirmed',
      muted: 'border-dotted border-status-unknown',
    },
  },
});

// The node marks where each leg starts, so two adjacent muted legs never read as one line.
const legNodeVariants = cva('size-3 shrink-0 rounded-full', {
  variants: {
    line: {
      solid: 'bg-status-confirmed',
      dashed: 'bg-status-confirmed',
      muted: 'bg-status-unknown',
    },
  },
});

const legTypeIcon: Record<LegType, LucideIcon> = {
  'road': Truck,
  'port': Anchor,
  'sea': Ship,
  'customs': Landmark,
  'last-mile': Package,
};

type LegSegmentProps = {
  line: LegLine;
};

function LegSegment({ line }: LegSegmentProps) {
  return (
    <div aria-hidden="true" className="flex items-center">
      <span className={legNodeVariants({ line })} />
      <span className={legLineVariants({ line })} />
    </div>
  );
}

type StateAppearance = { icon: LucideIcon; iconClassName: string; textClassName: string };

function stateAppearance(view: LegView): StateAppearance {
  if (view.state.kind === 'needs-review') {
    return { icon: Sparkles, iconClassName: 'text-status-ai', textClassName: 'text-status-ai' };
  }
  if (view.state.kind === 'unknown') {
    return { icon: CircleDashed, iconClassName: 'text-status-unknown', textClassName: 'text-muted-foreground' };
  }
  if (view.tone === 'critical') {
    return { icon: OctagonAlert, iconClassName: 'text-status-critical', textClassName: 'text-status-critical' };
  }
  if (view.tone === 'caution') {
    return { icon: TriangleAlert, iconClassName: 'text-status-caution', textClassName: 'text-status-caution' };
  }
  const icon = view.state.terminal ? CircleCheck : ArrowRight;
  return { icon, iconClassName: 'text-status-confirmed', textClassName: 'text-foreground' };
}

function stateText(view: LegView) {
  return view.state.kind === 'confirmed' ? view.state.fact.phrase : view.state.text;
}

const confidenceLabel = { high: 'High', medium: 'Medium', low: 'Low' };

// A band, never a score: a rule match or a correction is deterministic and shows none.
function reportText(report: OperatorReport) {
  const provenance = report.method === 'ai'
    ? `AI · ${confidenceLabel[report.confidence]}`
    : { rule: 'Rule', correction: 'Corrected' }[report.method];
  return `Operator wrote "${report.rawText}" · ${provenance}`;
}

type LegDetailsProps = {
  view: LegView;
  operatorName: (operatorId: string) => string;
};

function LegDetails({ view, operatorName }: LegDetailsProps) {
  const { state, lastConfirmed, warning, report } = view;

  return (
    <>
      {state.kind === 'confirmed' && (
        <p className="text-caption text-muted-foreground">
          {`${formatDateTime(state.fact.reportedAt)} · ${operatorName(state.fact.operatorId)}`}
        </p>
      )}
      {state.kind === 'needs-review' && (
        <p className="text-caption text-muted-foreground">{`Proposed: ${state.proposedPhrase}`}</p>
      )}
      {report && <p className="text-caption text-muted-foreground">{reportText(report)}</p>}
      {lastConfirmed && (
        <p className="text-caption text-muted-foreground">
          {`Last confirmed: ${lastConfirmed.phrase}, ${formatDateTime(lastConfirmed.reportedAt)}`}
        </p>
      )}
      {warning && (
        <p className="flex items-center gap-1 text-label text-status-caution">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {`No update within the expected ${warning.thresholdHours}h`}
        </p>
      )}
    </>
  );
}

type LegTimelineProps = {
  shipment: Shipment;
  now: string;
  sources: NormalisationSources;
  role: ViewerRole;
  operators: Operator[];
  // For list rows: the row itself states the problem, so each leg keeps only its line and mode.
  compact?: boolean;
};

export function LegTimeline({ shipment, now, sources, role, operators, compact = false }: LegTimelineProps) {
  const legViews = shipment.legs.map(leg => deriveLegView(leg, now, sources, role));
  const operatorName = (operatorId: string) =>
    operators.find(operator => operator.id === operatorId)?.name ?? operatorId;

  return (
    <ol
      aria-label="Shipment legs"
      className={cn(
        'grid auto-cols-fr',
        compact ? 'grid-flow-col gap-1' : 'gap-6 lg:grid-flow-col lg:gap-2',
      )}
    >
      {legViews.map((view, index) => {
        const { icon: StateIcon, iconClassName, textClassName } = stateAppearance(view);
        const LegTypeIcon = legTypeIcon[view.legType];
        if (compact) {
          return (
            <li key={view.legId} className="flex min-w-0 flex-col gap-1">
              <LegSegment line={view.line} />
              <p className="flex min-w-0 items-center gap-1 text-caption text-muted-foreground">
                <LegTypeIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{legTypeLabel[view.legType]}</span>
                <span className="sr-only">{`: ${stateText(view)}`}</span>
              </p>
            </li>
          );
        }
        return (
          <li key={view.legId} className="flex flex-col gap-2">
            <LegSegment line={view.line} />
            <p className="flex items-center gap-1 text-label text-muted-foreground">
              <LegTypeIcon aria-hidden="true" className="size-4 shrink-0" />
              {`Leg ${index + 1} of ${legViews.length} · ${legTypeLabel[view.legType]}`}
            </p>
            <p className={cn('flex items-start gap-2 text-body', textClassName)}>
              <StateIcon aria-hidden="true" className={cn('mt-1 size-4 shrink-0', iconClassName)} />
              {stateText(view)}
            </p>
            <LegDetails view={view} operatorName={operatorName} />
          </li>
        );
      })}
    </ol>
  );
}
