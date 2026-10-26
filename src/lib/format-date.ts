// Fixed, so the server and the browser render the same text whatever their own time zone.
const timeZone = 'Europe/Madrid';

const dayFormat = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' });

export function formatDay(isoDate: string) {
  return dayFormat.format(Date.parse(isoDate));
}

export function formatDateTime(isoDate: string) {
  return `${formatDay(isoDate)} ${timeFormat.format(Date.parse(isoDate))}`;
}

const hoursPerDay = 24;
const daysShownFromHours = 48;

// "0h" would read as no wait at all, right after an event is reported.
export function formatWaitingTime(hours: number) {
  if (hours < 1) return 'less than 1h';
  const wholeHours = Math.floor(hours);
  if (wholeHours < daysShownFromHours) return `${wholeHours}h`;
  return `${Math.floor(wholeHours / hoursPerDay)}d`;
}
