import { Injectable } from '@nestjs/common';
import { EarningsHistoryRepository } from './repositories/earnings-history.repository';
import {
  QuoteSummaryResult,
  fetchQuarterlyRevenueHistory,
} from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';
import { YahooRateLimiterService } from '../shared/yahoo-rate-limiter.service';

// Computes and persists ticker_earnings_history's quarterly EPS (from the
// quote summary) and quarterly revenue (fetched separately).
@Injectable()
export class EarningsHistorySyncService {
  constructor(
    private readonly earningsHistoryRepository: EarningsHistoryRepository,
    private readonly yahooRateLimiter: YahooRateLimiterService,
  ) {}

  async update(
    ref: TickerRef,
    quoteSummary: QuoteSummaryResult,
  ): Promise<void> {
    const eps = (quoteSummary.earningsHistory?.history ?? [])
      .filter(
        (entry): entry is typeof entry & { quarter: Date } =>
          entry.quarter != null,
      )
      .map((entry) => ({
        quarter: entry.quarter,
        actual: entry.epsActual ?? undefined,
        estimate: entry.epsEstimate ?? undefined,
      }));
    const revenue = await fetchQuarterlyRevenueHistory(
      this.yahooRateLimiter,
      ref.ticker,
    );

    await this.earningsHistoryRepository.upsert(ref, eps, revenue);
  }
}
