import type { ExceptionCause } from '@/domain/exceptions';
import type { NextAction, NoticeTemplate } from '@/domain/next-action';

// Simulated: a fixed table stands in for ranking actions by how similar past cases were resolved.
export const suggestedActionByCause: Record<ExceptionCause, NextAction> = {
  'customs-hold': 'upload-document',
  'delay': 'notify-customer',
  'silent-operator': 'contact-operator',
  'needs-review': 'review-status',
};

// Reviewing a status is internal: nothing reaches the customer, so it has no notice.
type NotifyingCause = Exclude<ExceptionCause, 'needs-review'>;

// Customer-facing, so no internal wording ("stale", "exception") and never a new delivery date.
export const noticeTemplateByCause: Record<NotifyingCause, NoticeTemplate> = {
  'delay': {
    subject: 'Your shipment is delayed',
    draftBody: ({ destinationCity, legPhrase, formattedSince }) =>
      `Your shipment to ${destinationCity} has been delayed on the ${legPhrase} since ${formattedSince}. We are following it with the carrier and will update you as soon as they confirm the next step.`,
  },
  'customs-hold': {
    subject: 'Your shipment is held at customs',
    draftBody: ({ destinationCity, formattedSince }) =>
      `Your shipment to ${destinationCity} has been held at customs since ${formattedSince} while a document is provided. We are sending it and will update you once customs releases the shipment.`,
  },
  'silent-operator': {
    subject: 'We are waiting for an update on your shipment',
    draftBody: ({ destinationCity, legPhrase, formattedSince }) =>
      `We have not received an update from the carrier on the ${legPhrase} of your shipment to ${destinationCity} since ${formattedSince}. We have asked them for details and will update you as soon as we hear back.`,
  },
};
