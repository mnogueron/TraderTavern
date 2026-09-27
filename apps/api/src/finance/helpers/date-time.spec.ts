import {
  isPastRegularClose,
  minutesPastRegularClose,
  regularCloseAt,
} from './date-time';
import { MarketHours } from '../schemas/market-hours.schema';

const cph: MarketHours = {
  market: 'CPH',
  label: 'Nasdaq Copenhagen',
  timezone: 'Europe/Copenhagen',
  regularOpen: '09:00',
  regularClose: '17:00',
  tradingDays: [1, 2, 3, 4, 5],
};

const tlv: MarketHours = {
  market: 'TLV',
  label: 'Tel Aviv',
  timezone: 'Asia/Jerusalem',
  regularOpen: '09:50',
  regularClose: '17:30',
  tradingDays: [0, 1, 2, 3, 4],
};

const setNow = (iso: string) => jest.setSystemTime(new Date(iso));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('isPastRegularClose', () => {
  it('is false during a regular Mon-Fri session', () => {
    // Wed 2026-09-23 12:00 Europe/Copenhagen (10:00 UTC, CEST = UTC+2)
    setNow('2026-09-23T10:00:00.000Z');
    expect(isPastRegularClose(cph)).toBe(false);
  });

  it('is true on a weekend even though it is not "past midnight"', () => {
    // Sat 2026-09-26 10:00 Europe/Copenhagen
    setNow('2026-09-26T08:00:00.000Z');
    expect(isPastRegularClose(cph)).toBe(true);
  });

  it('is false during a Sun-Thu session for a market with custom trading days', () => {
    // Sun 2026-09-27 12:00 Asia/Jerusalem (09:00 UTC, IDT = UTC+3)
    setNow('2026-09-27T09:00:00.000Z');
    expect(isPastRegularClose(tlv)).toBe(false);
  });

  it('is true on a Friday for a market that does not trade on Fridays', () => {
    // Fri 2026-09-25 12:00 Asia/Jerusalem
    setNow('2026-09-25T09:00:00.000Z');
    expect(isPastRegularClose(tlv)).toBe(true);
  });
});

describe('regularCloseAt', () => {
  it('resolves to the prior Friday close over a Mon-Fri market weekend', () => {
    // Sun 2026-09-27 03:00 UTC
    setNow('2026-09-27T03:00:00.000Z');
    // Fri 2026-09-25 17:00 Europe/Copenhagen == 15:00 UTC (CEST = UTC+2)
    expect(regularCloseAt(cph).toISOString()).toBe('2026-09-25T15:00:00.000Z');
  });

  it('resolves to the prior Thursday close over a Sun-Thu market Friday/Saturday', () => {
    // Sat 2026-09-26 03:00 UTC
    setNow('2026-09-26T03:00:00.000Z');
    // Thu 2026-09-24 17:30 Asia/Jerusalem == 14:30 UTC (IDT = UTC+3)
    expect(regularCloseAt(tlv).toISOString()).toBe('2026-09-24T14:30:00.000Z');
  });
});

describe('minutesPastRegularClose', () => {
  it('is null while the market is within its regular session', () => {
    setNow('2026-09-23T10:00:00.000Z');
    expect(minutesPastRegularClose(cph)).toBeNull();
  });

  it('counts minutes since the actual last trading-day close, spanning the weekend', () => {
    // Mon 2026-09-28 06:00 UTC == 08:00 Europe/Copenhagen, before that day's open,
    // so the last close is still Friday's (2026-09-25T15:00:00.000Z UTC).
    setNow('2026-09-28T06:00:00.000Z');
    expect(minutesPastRegularClose(cph)).toBe(3780);
  });
});
