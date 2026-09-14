import { Injectable } from '@nestjs/common';
import {
  CANDLE_COUNT_ENV_VAR,
  CANDLE_LOOKBACK_MULTIPLIER,
  CANDLE_WINDOW_DURATION_MS,
  DEFAULT_CANDLE_COUNT,
} from './constants/candle-windows';
import { CandleWindow } from './enums/candle-window.enum';
import { TechnicalDataRepository } from './repositories/technical-data.repository';
import { fetchCandleChart } from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';
import { AppConfigService } from '../shared/app-config.service';
import { YahooRateLimiterService } from '../shared/yahoo-rate-limiter.service';

// Computes and persists technical_ticker_data candles for every candle
// window, derived from Yahoo's chart endpoint.
@Injectable()
export class TechnicalSyncService {
  constructor(
    private readonly technicalDataRepository: TechnicalDataRepository,
    private readonly configService: AppConfigService,
    private readonly yahooRateLimiter: YahooRateLimiterService,
  ) {}

  async syncTechnical(ref: TickerRef): Promise<void> {
    for (const window of Object.values(CandleWindow)) {
      await this.syncCandles(ref, window);
    }
  }

  private getCandleCount(window: CandleWindow): number {
    return this.configService.getNumber(
      CANDLE_COUNT_ENV_VAR[window],
      DEFAULT_CANDLE_COUNT[window],
    );
  }

  private async syncCandles(
    ref: TickerRef,
    window: CandleWindow,
  ): Promise<void> {
    const count = this.getCandleCount(window);
    const lookbackMs =
      count * CANDLE_WINDOW_DURATION_MS[window] * CANDLE_LOOKBACK_MULTIPLIER;

    const chart = await fetchCandleChart(
      this.yahooRateLimiter,
      ref.ticker,
      new Date(Date.now() - lookbackMs),
      window,
    );

    const candles = (chart.quotes ?? [])
      .filter(
        (
          quote,
        ): quote is typeof quote & {
          open: number;
          close: number;
          low: number;
          high: number;
          volume: number;
        } =>
          quote.open != null &&
          quote.close != null &&
          quote.low != null &&
          quote.high != null &&
          quote.volume != null,
      )
      .slice(-count);

    if (candles.length === 0) {
      return;
    }

    const durationMs = CANDLE_WINDOW_DURATION_MS[window];

    await this.technicalDataRepository.upsertCandles(
      ref,
      window,
      candles.map((candle) => ({
        startTime: candle.date,
        endTime: new Date(candle.date.getTime() + durationMs),
        entry: candle.open,
        exit: candle.close,
        low: candle.low,
        high: candle.high,
        volume: candle.volume,
      })),
    );
  }
}
