import { MarketHours } from '../schemas/market-hours.schema';

// "HH:mm" (24h) for the current moment in `timezone`.
function localHHmm(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}

// Whether `hours`' regular session is over for the current moment in its
// own timezone.
export function isPastRegularClose(hours: MarketHours): boolean {
  const localTime = localHHmm(hours.timezone);

  // Once local time has wrapped past midnight into the next calendar day,
  // today's regular session (which always closes before midnight) is
  // necessarily long over. Comparing "HH:mm" strings naively would read
  // e.g. "00:39" as earlier than a "17:30" close and wrongly treat the
  // market as still open, so also treat any time before the next open as
  // past-close.
  return localTime >= hours.regularClose || localTime < hours.regularOpen;
}

function hhmmToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

// Minutes elapsed since `hours`' most recent regular close, for the current
// moment in its own timezone; null while the market is within (or hasn't
// yet reached) its regular session. Handles the same after-midnight wrap as
// isPastRegularClose (e.g. 00:39 local is ~7h after a 17:30 close, not
// "before" it).
export function minutesPastRegularClose(hours: MarketHours): number | null {
  if (!isPastRegularClose(hours)) {
    return null;
  }

  const nowMinutes = hhmmToMinutes(localHHmm(hours.timezone));
  const closeMinutes = hhmmToMinutes(hours.regularClose);

  return nowMinutes >= closeMinutes
    ? nowMinutes - closeMinutes
    : 24 * 60 - closeMinutes + nowMinutes;
}

// TODO migrate these functions to a proper library instead like date-fns
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

export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const startOfTomorrow = (): Date => {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
};
