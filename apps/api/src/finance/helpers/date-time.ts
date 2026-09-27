import { MarketHours } from '../schemas/market-hours.schema';
import { DEFAULT_TRADING_DAYS } from '../constants/trading-days';

// "HH:mm" (24h) for `date` in `timezone`.
export function formatLocalTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

// "HH:mm" (24h) for the current moment in `timezone`.
function localHHmm(timezone: string): string {
  return formatLocalTime(new Date(), timezone);
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

// `hours.tradingDays`, falling back to Mon-Fri for records predating that
// field (e.g. read via `.lean()`, which skips schema defaults).
function resolveTradingDays(hours: MarketHours): readonly number[] {
  return hours.tradingDays?.length ? hours.tradingDays : DEFAULT_TRADING_DAYS;
}

// Day-of-week index (0 = Sunday) of `date`'s local calendar day in
// `timezone`.
function weekdayIndex(date: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

function isTradingDay(hours: MarketHours, date: Date): boolean {
  return resolveTradingDays(hours).includes(weekdayIndex(date, hours.timezone));
}

// Whether `hours`' regular session is over for the current moment in its
// own timezone — either because today isn't one of its trading days at all,
// or because local time has moved past today's close (or hasn't yet reached
// today's open, which also means the prior session's close already passed).
export function isPastRegularClose(hours: MarketHours): boolean {
  const now = new Date();
  if (!isTradingDay(hours, now)) {
    return true;
  }

  const localTime = localHHmm(hours.timezone);
  return localTime >= hours.regularClose || localTime < hours.regularOpen;
}

// Minutes elapsed since `hours`' most recently completed regular close;
// null while the market is within its regular session.
export function minutesPastRegularClose(hours: MarketHours): number | null {
  if (!isPastRegularClose(hours)) {
    return null;
  }

  return Math.floor((Date.now() - regularCloseAt(hours).getTime()) / 60_000);
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
// close (in the market's own timezone) once local time has reached it and
// today is a trading day, otherwise the closest preceding trading day's
// close. This way a sync sitting mid-session, pre-market, or on a
// non-trading day (weekend, or any day outside `hours.tradingDays`) still
// gets tagged with the close its EOD data actually reflects, never one that
// hasn't happened yet.
export function regularCloseAt(hours: MarketHours): Date {
  const now = new Date();
  const closedToday =
    isTradingDay(hours, now) && localHHmm(hours.timezone) >= hours.regularClose;

  let candidate = closedToday
    ? now
    : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  while (!isTradingDay(hours, candidate)) {
    candidate = new Date(candidate.getTime() - 24 * 60 * 60 * 1000);
  }

  const dateKey = calendarDateKey(candidate, hours.timezone);
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
