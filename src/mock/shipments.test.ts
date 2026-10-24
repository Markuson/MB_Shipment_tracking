import { describe, expect, it } from 'vitest';
import { deriveExceptions } from '@/domain/exceptions';
import { deriveLegStatus, isReliable } from '@/domain/leg-status';
import { mockNormalisationSources } from './normalisation';
import { demoStartTime, mockShipments } from './shipments';

describe('mock shipments at the demo start', () => {
  it('raise exactly the exception each challenge case is written to show', () => {
    const causesByShipment = Object.fromEntries(mockShipments.map(shipment => [
      shipment.id,
      deriveExceptions(shipment, demoStartTime, mockNormalisationSources).map(exception => exception.cause),
    ]));

    expect(causesByShipment).toEqual({
      'shp-1001': [],
      'shp-1002': ['delay'],
      'shp-1003': ['customs-hold'],
      'shp-1004': ['silent-operator'],
      'shp-1005': ['needs-review'],
      'shp-1006': [],
    });
  });

  it('leave the ambiguous road update of case 5 for review instead of showing it as a fact', () => {
    const ambiguousLeg = mockShipments.find(shipment => shipment.id === 'shp-1005')?.legs.at(0);
    if (!ambiguousLeg) throw new Error('Case 5 has no road leg');

    const status = deriveLegStatus(ambiguousLeg, demoStartTime, mockNormalisationSources);

    expect(status).toMatchObject({ kind: 'confirmed', value: { method: 'ai', confidence: 'low' } });
    expect(isReliable(status)).toBe(false);
  });
});
