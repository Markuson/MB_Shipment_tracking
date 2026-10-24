import { describe, expect, it } from 'vitest';
import { normalise } from '@/domain/normalise';
import { findStatusDefinition } from '@/domain/vocabulary';
import { mockNormalisationSources } from './normalisation';
import { mockShipments } from './shipments';

describe('mock normalisation sources', () => {
  it('turn every mock event into a code of its leg type, or a guess left for review', () => {
    const legs = mockShipments.flatMap(shipment => shipment.legs);

    // Listing the offending events makes a failure name the wording to fix.
    const eventsWithoutUsableStatus = legs.flatMap(leg => leg.events
      .filter((event) => {
        const status = normalise(event, mockNormalisationSources);
        const isDefinedForLegType = findStatusDefinition(leg.type, status.code) !== undefined;
        const isLeftForReview = status.method === 'ai' && status.needsReview;
        return !isDefinedForLegType && !isLeftForReview;
      })
      .map(event => `${leg.id}: ${event.rawText}`));

    expect(eventsWithoutUsableStatus).toEqual([]);
  });
});
