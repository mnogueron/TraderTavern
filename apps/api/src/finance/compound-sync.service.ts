import { Injectable } from '@nestjs/common';
import { CompoundTechnicalDataRepository } from './repositories/compound-technical-data.repository';
import { MarketService } from './market.service';
import { calendarDateKey, isPastRegularClose } from './helpers/date-time';
import { DailyChartResult, QuoteSummaryResult } from './helpers/sync-fetchers';
import { computeTechnicalIndicators } from './helpers/technical-indicators';
import { TickerRef } from './helpers/sync-utils';

// Computes and persists compound_technical_ticker_data: the live price,
// change-percent series (1d through 1y/YTD), and technical indicators
// derived from a ticker's quote summary and daily chart.
@Injectable()
export class CompoundSyncService {
  constructor(
    private readonly compoundTechnicalDataRepository: CompoundTechnicalDataRepository,
    private readonly marketService: MarketService,
  ) {}

  async update(
    ref: TickerRef,
    syncDate: Date,
    quoteSummary: QuoteSummaryResult,
    chart: DailyChartResult,
  ): Promise<void> {
    const { price } = quoteSummary;

    const quotes = (chart.quotes ?? []).filter(
      (quote): quote is typeof quote & { close: number } => quote.close != null,
    );
    const technicalIndicators = computeTechnicalIndicators(
      (chart.quotes ?? []).filter(
        (
          quote,
        ): quote is typeof quote & {
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        } =>
          quote.open != null &&
          quote.high != null &&
          quote.low != null &&
          quote.close != null &&
          quote.volume != null,
      ),
    );
    const latestClose =
      price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null;

    // The chart endpoint's most recent daily bar can still have a null
    // close for a brief window around/after market close (Yahoo hasn't
    // published the final bar yet), which the filter above drops — so
    // `quotes.at(-1)` can silently lag by a day right when a market has
    // just closed. The quoteSummary endpoint's live `price` fields don't
    // have that lag: `regularMarketPrice` is the live price while a
    // session is open and freezes at the official close once it ends;
    // `regularMarketPreviousClose` is always the close of the session
    // before that. Use those directly for the anchor/prior pair so 1D
    // change is never off by a day, and only fall back to `quotes` (for
    // the "market still open" case, where we need the close from *two*
    // sessions ago) or when live quote fields are unavailable.
    const hours = price?.exchange
      ? await this.marketService.findHoursForMarket(price.exchange)
      : null;
    const isClosedToday = hours != null && isPastRegularClose(hours);

    // While a session is open, Yahoo's daily chart already includes today's
    // candle with a non-null (live, still-moving) close, so it isn't a
    // "completed session" yet. The `quotes.close != null` filter above
    // doesn't exclude it, which used to shift `.at(-1)`/`.at(-2)` by one day
    // and made the "market still open" branch below compare yesterday's
    // close against itself (via two different data sources) instead of
    // against the day before. Strip today's candle before any positional
    // lookup so `.at(-1)`/`.at(-2)` always point at completed sessions.
    const todayKey = calendarDateKey(new Date(), hours?.timezone);
    const completedQuotes = quotes.filter(
      (quote) => calendarDateKey(quote.date, hours?.timezone) !== todayKey,
    );

    // "anchor": the most recent completed session's close — today's once
    // the market has closed for the day, otherwise yesterday's. The closed
    // branch's fallback intentionally uses the raw `quotes` (not
    // `completedQuotes`), since once the market closes, today's candle is
    // exactly what we want to pick up there.
    const anchorClose = isClosedToday
      ? (price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null)
      : (price?.regularMarketPreviousClose ??
        completedQuotes.at(-1)?.close ??
        null);
    // "prior": the completed session immediately before the anchor. Always
    // uses `completedQuotes`, since "prior" is never today regardless of
    // branch.
    const priorClose = isClosedToday
      ? (price?.regularMarketPreviousClose ??
        completedQuotes.at(-1)?.close ??
        null)
      : (completedQuotes.at(-2)?.close ?? null);

    const changePercent1d =
      anchorClose != null && priorClose != null && priorClose !== 0
        ? ((anchorClose - priorClose) / priorClose) * 100
        : undefined;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    await this.compoundTechnicalDataRepository.upsert(ref, syncDate, {
      price: latestClose ?? undefined,
      changePercent1d,
      changePercent2d: this.changePercentFromDaysAgo(anchorClose, quotes, 2),
      changePercent5d: this.changePercentFromDaysAgo(anchorClose, quotes, 5),
      changePercent1w: this.changePercentFromDaysAgo(anchorClose, quotes, 7),
      changePercent1m: this.changePercentFromDaysAgo(anchorClose, quotes, 30),
      changePercent3m: this.changePercentFromDaysAgo(anchorClose, quotes, 91),
      changePercent6m: this.changePercentFromDaysAgo(anchorClose, quotes, 182),
      changePercentYtd: this.changePercentFromDate(
        anchorClose,
        quotes,
        startOfYear,
      ),
      changePercent1y: this.changePercentFromDaysAgo(anchorClose, quotes, 365),
      ...technicalIndicators,
    });
  }

  private changePercentFromDaysAgo(
    latestClose: number | null,
    quotes: { date: Date; close: number }[],
    calendarDaysAgo: number,
  ): number | undefined {
    const targetDate = new Date(
      Date.now() - calendarDaysAgo * 24 * 60 * 60 * 1000,
    );
    return this.changePercentFromDate(latestClose, quotes, targetDate);
  }

  private changePercentFromDate(
    latestClose: number | null,
    quotes: { date: Date; close: number }[],
    targetDate: Date,
  ): number | undefined {
    if (latestClose == null || quotes.length === 0) {
      return undefined;
    }
    // Anchor to the last close on or before the target date, not merely the
    // chronologically nearest one — around gaps like the New Year holiday,
    // the nearest quote by absolute distance can land on the wrong side of
    // the boundary (e.g. the first trading day of the new year instead of
    // the last one of the previous year), silently skewing YTD/period
    // returns. Fall back to the earliest available quote if the ticker's
    // history doesn't reach back to the target date.
    const onOrBefore = quotes.filter(
      (quote) => quote.date.getTime() <= targetDate.getTime(),
    );
    const closest =
      onOrBefore.length > 0 ? onOrBefore[onOrBefore.length - 1] : quotes[0];
    if (closest.close === 0) {
      return undefined;
    }
    return ((latestClose - closest.close) / closest.close) * 100;
  }
}
