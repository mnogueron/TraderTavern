import { Injectable } from '@nestjs/common';
import { MarketHoursRepository } from './repositories/market-hours.repository';
import { MarketHours } from './schemas/market-hours.schema';
import { ChartMetaResult } from './helpers/sync-fetchers';
import { formatLocalTime } from './helpers/date-time';

// Seeds market_hours from a Yahoo chart's `meta.currentTradingPeriod` — the
// only place Yahoo exposes a market's actual pre/regular/post session times
// (as UTC instants for today) alongside its IANA timezone name. Used to
// backfill markets discovered without a manually curated market_hours entry
// (see TickerSyncService.discoverMissingMarketHours).
@Injectable()
export class MarketHoursSyncService {
  constructor(private readonly marketHoursRepository: MarketHoursRepository) {}

  async upsertFromChartMeta(
    market: string,
    meta: ChartMetaResult,
  ): Promise<MarketHours> {
    const timezone = meta.exchangeTimezoneName;
    const period = meta.currentTradingPeriod;

    return this.marketHoursRepository.upsert(market, {
      label: meta.fullExchangeName ?? meta.exchangeName ?? market,
      timezone,
      preMarketOpen: period?.pre
        ? formatLocalTime(period.pre.start, timezone)
        : undefined,
      regularOpen: formatLocalTime(period.regular.start, timezone),
      regularClose: formatLocalTime(period.regular.end, timezone),
      postMarketClose: period?.post
        ? formatLocalTime(period.post.end, timezone)
        : undefined,
    });
  }
}
