export type NextAction = 'notify-customer' | 'contact-operator' | 'upload-document';

// Dates arrive already formatted, so a template never decides a time zone.
export type NoticeContext = {
  destinationCity: string;
  legPhrase: string;
  formattedSince: string;
};

export type NoticeTemplate = {
  subject: string;
  draftBody: (context: NoticeContext) => string;
};
