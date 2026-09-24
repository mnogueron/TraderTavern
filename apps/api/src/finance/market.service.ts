import { Injectable } from '@nestjs/common';
import { SyncKind } from './enums/sync-kind.enum';
import { MarketHours } from './schemas/market-hours.schema';
import { MarketHoursRepository } from './repositories/market-hours.repository';
import { TickerStaticDataRepository } from './repositories/ticker-static-data.repository';
import {
  isPastRegularClose,
  regularCloseAt,
  startOfToday,
} from './helpers/date-time';

// Everything related to markets and market hours: looking up which market
// each ISIN trades on, fetching market hours, and deciding whether a given
// market is due for a close-gated sync. Grouping/chunking ISINs by market
// is a sync-scheduling concern and stays in TickerSyncService.
@Injectable()
export class MarketService {
  constructor(
    private readonly marketHoursRepository: MarketHoursRepository,
    private readonly tickerStaticDataRepository: TickerStaticDataRepository,
  ) {}

  // Only the full ticker sync and the standalone compound sync depend on a
  // market's session having closed (so changePercent1d etc. reflect the
  // official close rather than a mid-session price); static/fundamental/
  // technical data isn't tied to a specific session, so those kinds sync on
  // demand regardless of market hours. Gated on regular close only, not
  // post-market close: waiting for post-market would delay e.g. NASDAQ
  // until the small hours of the European morning, which is worse for
  // same-day analysis than syncing the regular-session close a few hours
  // earlier.
  isMarketCloseGated(kind: SyncKind): boolean {
    return kind === SyncKind.Ticker || kind === SyncKind.Compound;
  }

  isMarketDueForSync(
    market: string | null,
    marketHoursByCode: Map<string, MarketHours>,
  ): boolean {
    if (market == null) {
      return true;
    }
    const hours = marketHoursByCode.get(market);
    if (!hours) {
      return true;
    }
    return isPastRegularClose(hours);
  }

  // The UTC instant a sync for `market` should be tagged with: the market's
  // most recent regular close, so EOD data is associated with the trading
  // session it reflects rather than an arbitrary calendar day. Falls back
  // to the start of today (UTC) when the market is unresolved or its hours
  // aren't configured yet.
  closingSyncDate(
    market: string | null,
    marketHoursByCode: Map<string, MarketHours>,
  ): Date {
    if (market == null) {
      return startOfToday();
    }
    const hours = marketHoursByCode.get(market);
    return hours ? regularCloseAt(hours) : startOfToday();
  }

  async getMarketHoursByCode(): Promise<Map<string, MarketHours>> {
    const hours = await this.marketHoursRepository.findAll();
    return new Map(hours.map((h) => [h.market, h]));
  }

  async findHoursForMarket(market: string): Promise<MarketHours | null> {
    return this.marketHoursRepository.findByMarket(market);
  }

  // Market (Yahoo exchange code) per ISIN, for every ticker with static
  // data synced so far. ISINs missing here haven't had their market
  // resolved yet (e.g. pending their first static sync).
  async getMarketByIsin(): Promise<Map<string, string | undefined>> {
    const refs = await this.tickerStaticDataRepository.findAllRefsWithMarket();
    return new Map(refs.map((ref) => [ref.isin, ref.market]));
  }
}
