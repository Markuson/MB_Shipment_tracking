import { deriveLegStatus, isReliable, isStale } from './leg-status';
import type { NormalisationSources } from './normalise';
import type { Leg, Shipment } from './shipment';
import { isTerminalStatus } from './vocabulary';

export type ExceptionCause = 'customs-hold' | 'delay' | 'silent-operator' | 'needs-review';
export type ExceptionSeverity = 'critical' | 'caution';

export type ShipmentException = {
  shipmentId: string;
  legId: string;
  cause: ExceptionCause;
  severity: ExceptionSeverity;
  since: string;
};

const severityByCause: Record<ExceptionCause, ExceptionSeverity> = {
  'customs-hold': 'critical',
  'silent-operator': 'critical',
  'delay': 'caution',
  'needs-review': 'caution',
};

const severityOrder: ExceptionSeverity[] = ['critical', 'caution'];

type LegException = Pick<ShipmentException, 'cause' | 'since'>;

// An exception says "review this", never "this is true": a status that needs review raises only
// `needs-review`, because acting on the guess itself would treat it as a fact.
function findLegException(leg: Leg, now: string, sources: NormalisationSources): LegException | undefined {
  if (isStale(leg, now)) return { cause: 'silent-operator', since: leg.planned.start };

  const status = deriveLegStatus(leg, now, sources);
  if (status.kind !== 'confirmed') return undefined;
  if (!isReliable(status)) return { cause: 'needs-review', since: status.reportedAt };

  const { code } = status.value;
  if (leg.type === 'customs' && code === 'held') return { cause: 'customs-hold', since: status.reportedAt };
  if (code === 'delayed') return { cause: 'delay', since: status.reportedAt };
  // A failed delivery reaches the customer directly, so it is handled like a delay: notify them.
  if (leg.type === 'last-mile' && code === 'delivery-exception') return { cause: 'delay', since: status.reportedAt };

  const isBehindPlan = !isTerminalStatus(leg.type, code) && Date.parse(now) > Date.parse(leg.planned.end);
  if (isBehindPlan) return { cause: 'delay', since: leg.planned.end };
  return undefined;
}

export function deriveExceptions(shipment: Shipment, now: string, sources: NormalisationSources) {
  return shipment.legs.flatMap((leg): ShipmentException[] => {
    const legException = findLegException(leg, now, sources);
    if (!legException) return [];
    return [{ shipmentId: shipment.id, legId: leg.id, severity: severityByCause[legException.cause], ...legException }];
  });
}

// Most severe first, then the oldest, since it has waited longest for someone to act.
export function rankExceptions(exceptions: ShipmentException[]) {
  return exceptions.toSorted((first, second) => {
    const severityDifference = severityOrder.indexOf(first.severity) - severityOrder.indexOf(second.severity);
    if (severityDifference !== 0) return severityDifference;
    return Date.parse(first.since) - Date.parse(second.since);
  });
}
