import { MarketHours } from '../schemas/market-hours.schema';

// Whether `hours`' regular session is over for the current moment in its
// own timezone.
export function isPastRegularClose(hours: MarketHours): boolean {
  const localTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: hours.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());

  // Once local time has wrapped past midnight into the next calendar day,
  // today's regular session (which always closes before midnight) is
  // necessarily long over. Comparing "HH:mm" strings naively would read
  // e.g. "00:39" as earlier than a "17:30" close and wrongly treat the
  // market as still open, so also treat any time before the next open as
  // past-close.
  return localTime >= hours.regularClose || localTime < hours.regularOpen;
}

// Calendar date (YYYY-MM-DD) of `date` in `timezone` (UTC if omitted), used
// to tell whether a daily candle belongs to "today" regardless of what time
// the sync happens to run at.
export function calendarDateKey(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone ?? 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
