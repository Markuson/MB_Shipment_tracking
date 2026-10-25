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
import { deriveLegView, legTypeLabel, type LegView, type ViewerRole } from '@/domain/leg-view';
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

type LegDetailsProps = {
  view: LegView;
  operatorName: (operatorId: string) => string;
};

function LegDetails({ view, operatorName }: LegDetailsProps) {
  const { state, lastConfirmed, warning } = view;

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
};

export function LegTimeline({ shipment, now, sources, role, operators }: LegTimelineProps) {
  const legViews = shipment.legs.map(leg => deriveLegView(leg, now, sources, role));
  const operatorName = (operatorId: string) =>
    operators.find(operator => operator.id === operatorId)?.name ?? operatorId;

  return (
    <ol aria-label="Shipment legs" className="grid gap-6 lg:auto-cols-fr lg:grid-flow-col lg:gap-2">
      {legViews.map((view, index) => {
        const { icon: StateIcon, iconClassName, textClassName } = stateAppearance(view);
        const LegTypeIcon = legTypeIcon[view.legType];
        return (
          <li key={view.legId} className="flex flex-col gap-2">
            <div aria-hidden="true" className="flex items-center">
              <span className={legNodeVariants({ line: view.line })} />
              <span className={legLineVariants({ line: view.line })} />
            </div>
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
