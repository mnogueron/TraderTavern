import { Injectable, Logger } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { TickerDto } from './dto/Ticker.dto';
import { SCREENER_TICKERS } from './constants/tickers';

const yahooFinance = new YahooFinance();

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  async getScreener(): Promise<TickerDto[]> {
    const results = await Promise.allSettled(
      SCREENER_TICKERS.map((ticker) => this.fetchTicker(ticker)),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<TickerDto> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
  }

  private async fetchTicker(ticker: string): Promise<TickerDto> {
    try {
      const { price, summaryDetail, assetProfile } =
        await yahooFinance.quoteSummary(ticker, {
          modules: ['price', 'summaryDetail', 'assetProfile'],
        });

      return new TickerDto(
        ticker,
        price?.longName ?? price?.shortName ?? ticker,
        assetProfile?.sector ?? null,
        assetProfile?.industry ?? null,
        summaryDetail?.marketCap ?? price?.marketCap ?? null,
        summaryDetail?.trailingPE ?? null,
        price?.regularMarketPrice ?? null,
        assetProfile?.country ?? null,
      );
    } catch (error) {
      this.logger.warn(`Failed to fetch ticker ${ticker}: ${error}`);
      throw error;
    }
  }
}
