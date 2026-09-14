import { Injectable } from '@nestjs/common';
import {
  CANDLE_COUNT_ENV_VAR,
  CANDLE_LOOKBACK_MULTIPLIER,
  CANDLE_WINDOW_DURATION_MS,
  DEFAULT_CANDLE_COUNT,
} from './constants/candle-windows';
import { CandleWindow } from './enums/candle-window.enum';
import { TechnicalDataRepository } from './repositories/technical-data.repository';
import { DailyChartResult } from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';
import { AppConfigService } from '../shared/app-config.service';

// Computes and persists technical_ticker_data candles for every candle
// window, from chart data already fetched by TickerSyncService.
@Injectable()
export class TechnicalSyncService {
  constructor(
    private readonly technicalDataRepository: TechnicalDataRepository,
    private readonly configService: AppConfigService,
  ) {}

  async syncTechnical(
    ref: TickerRef,
    chartsByWindow: Map<CandleWindow, DailyChartResult>,
  ): Promise<void> {
    for (const window of Object.values(CandleWindow)) {
      const chart = chartsByWindow.get(window);
      if (chart) {
        await this.syncCandles(ref, window, chart);
      }
    }
  }

  getCandleCount(window: CandleWindow): number {
    return this.configService.getNumber(
      CANDLE_COUNT_ENV_VAR[window],
      DEFAULT_CANDLE_COUNT[window],
    );
  }

  // Earliest date TickerSyncService should fetch this window's chart from,
  // accounting for the configured candle count and CANDLE_LOOKBACK_MULTIPLIER.
  getLookbackDate(window: CandleWindow): Date {
    const count = this.getCandleCount(window);
    const lookbackMs =
      count * CANDLE_WINDOW_DURATION_MS[window] * CANDLE_LOOKBACK_MULTIPLIER;
    return new Date(Date.now() - lookbackMs);
  }

  private async syncCandles(
    ref: TickerRef,
    window: CandleWindow,
    chart: DailyChartResult,
  ): Promise<void> {
    const count = this.getCandleCount(window);

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
