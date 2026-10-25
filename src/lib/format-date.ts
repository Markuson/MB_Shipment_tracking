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
