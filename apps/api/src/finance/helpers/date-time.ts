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

// `timezone`'s UTC offset in minutes (e.g. -240 for UTC-4) at `at`.
function utcOffsetMinutes(timezone: string, at: Date): number {
  const offsetName = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value;

  const match = offsetName?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

// The UTC instant of `hhmm` wall-clock time on the local calendar date
// `dateKey` (YYYY-MM-DD) in `timezone`. No timezone-aware date library is
// used elsewhere in this file (see localHHmm), so the offset is derived via
// Intl instead: a guess instant (the wall-clock digits read as if UTC) is
// enough to look up the right offset since `hhmm` is always an ordinary
// market hour, nowhere near a DST transition.
function zonedTimeToUtc(dateKey: string, hhmm: string, timezone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMinutes = utcOffsetMinutes(timezone, guess);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
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

// The UTC instant of `hours`' most recently completed regular close: today's
// close (in the market's own timezone) once local time has reached it,
// otherwise yesterday's. This way a sync sitting mid-session or pre-market
// (e.g. a future pre-market chunk) still gets tagged with the close its EOD
// data actually reflects, never one that hasn't happened yet.
export function regularCloseAt(hours: MarketHours): Date {
  const now = new Date();
  const dateKey =
    localHHmm(hours.timezone) >= hours.regularClose
      ? calendarDateKey(now, hours.timezone)
      : calendarDateKey(
          new Date(now.getTime() - 24 * 60 * 60 * 1000),
          hours.timezone,
        );

  return zonedTimeToUtc(dateKey, hours.regularClose, hours.timezone);
}

export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

export const startOfTomorrow = (): Date => {
  const today = startOfToday();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
};
