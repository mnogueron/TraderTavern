type MarketHours = {
  timezone: string;
  regularOpen: string;
  regularClose: string;
  tradingDays?: number[];
};

const DEFAULT_TRADING_DAYS = [1, 2, 3, 4, 5];

const resolveTradingDays = (hours: MarketHours): number[] =>
  hours.tradingDays?.length ? hours.tradingDays : DEFAULT_TRADING_DAYS;

const weekdayIndex = (date: Date, timezone: string): number => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
};

const isTradingDay = (hours: MarketHours, date: Date): boolean =>
  resolveTradingDays(hours).includes(weekdayIndex(date, hours.timezone));

const formatLocalTime = (date: Date, timezone: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

const calendarDateKey = (date: Date, timezone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const utcOffsetMinutes = (timezone: string, at: Date): number => {
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
};

const zonedTimeToUtc = (
  dateKey: string,
  hhmm: string,
  timezone: string,
): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMinutes = utcOffsetMinutes(timezone, guess);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
};

// The UTC instant of `hours`' most recently completed regular close: today's
// close (in the market's own timezone) once local time has reached it and
// today is a trading day, otherwise the closest preceding trading day's
// close. Mirrors the backend's `regularCloseAt` helper
// (apps/api/src/finance/helpers/date-time.ts).
export const lastRegularCloseAt = (hours: MarketHours): Date => {
  const now = new Date();
  const closedToday =
    isTradingDay(hours, now) &&
    formatLocalTime(now, hours.timezone) >= hours.regularClose;

  let candidate = closedToday
    ? now
    : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  while (!isTradingDay(hours, candidate)) {
    candidate = new Date(candidate.getTime() - 24 * 60 * 60 * 1000);
  }

  const dateKey = calendarDateKey(candidate, hours.timezone);
  return zonedTimeToUtc(dateKey, hours.regularClose, hours.timezone);
};
