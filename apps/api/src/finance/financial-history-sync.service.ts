import { Injectable } from '@nestjs/common';
import { FinancialHistoryRepository } from './repositories/financial-history.repository';
import { fetchFinancialHistory } from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';
import { YahooRateLimiterService } from '../shared/yahoo-rate-limiter.service';

// Computes and persists ticker_financial_history's annual periods, along
// with the Piotroski/Altman quality scores derived from them.
@Injectable()
export class FinancialHistorySyncService {
  constructor(
    private readonly financialHistoryRepository: FinancialHistoryRepository,
    private readonly yahooRateLimiter: YahooRateLimiterService,
  ) {}

  async update(
    ref: TickerRef,
    marketCap?: number,
  ): Promise<{ piotroskiScore?: number; altmanZScore?: number }> {
    const { periods, piotroskiScore, altmanZScore } =
      await fetchFinancialHistory(this.yahooRateLimiter, ref.ticker, marketCap);

    await this.financialHistoryRepository.upsertAnnual(ref, periods);

    return { piotroskiScore, altmanZScore };
  }
}
