import type { RouteHistory } from '@/domain/eta';

// Invented, and chosen for the story the demo tells: the hero starts on time, and the berth wait
// the demo panel reports turns it into a possible delay, not a certain one, because the booking
// leaves slack before the promised date. Routes left out have no history, so they get no estimate.
export const routeHistory: RouteHistory = {
  'site-valencia>Hamburg': {
    onSchedule: {
      earliestHours: -6,
      latestHours: 0,
      confidence: 'high',
      reason: 'The last 12 shipments on this route that were on schedule at sea arrived up to 6 hours before the promised time.',
    },
    delayedOn: {
      sea: {
        earliestHours: -4,
        latestHours: 36,
        confidence: 'medium',
        reason: '8 past shipments on this route were delayed at sea, mostly waiting for a berth in Hamburg. They arrived between 4 hours before and 36 hours after the promised time.',
      },
    },
  },
  'site-zaragoza>Barcelona': {
    onSchedule: {
      earliestHours: -3,
      latestHours: 0,
      confidence: 'high',
      reason: 'The last 20 shipments on this route that left on time arrived up to 3 hours before the promised time.',
    },
  },
};
