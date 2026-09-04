import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TICKER_SYNC_ERROR_THRESHOLD } from './constants/candle-windows';
import {
  TickerSyncHealth,
  TickerSyncHealthDocument,
} from './schemas/ticker-sync-health.schema';
import { TickerRef } from './helpers/sync-utils';

// Tracks per-ISIN sync health so a persistently broken ticker is excluded
// from future automated sync attempts instead of being retried forever (see
// TICKER_SYNC_ERROR_THRESHOLD). A single shared service backs both the sync
// job (recordSuccess/recordFailure/getHiddenIsins) and the settings UI
// (listHidden/unhideByTicker).
@Injectable()
export class TickerHealthService {
  constructor(
    @InjectModel(TickerSyncHealth.name)
    private readonly tickerSyncHealthModel: Model<TickerSyncHealthDocument>,
  ) {}

  async recordSuccess(ref: TickerRef): Promise<void> {
    await this.tickerSyncHealthModel.updateOne(
      { isin: ref.isin },
      {
        $set: { isin: ref.isin, ticker: ref.ticker, errorCount: 0, hidden: false },
        $unset: { lastError: '', lastErrorAt: '', hiddenAt: '' },
      },
      { upsert: true },
    );
  }

  // Increments the error counter for this ISIN and hides it once the
  // counter reaches TICKER_SYNC_ERROR_THRESHOLD. Returns whether this call
  // just crossed the threshold (i.e. the ticker just became hidden), so
  // callers can log it.
  async recordFailure(ref: TickerRef, error: unknown): Promise<boolean> {
    const message = error instanceof Error ? error.message : String(error);

    const updated = await this.tickerSyncHealthModel.findOneAndUpdate(
      { isin: ref.isin },
      {
        $set: { isin: ref.isin, ticker: ref.ticker, lastError: message, lastErrorAt: new Date() },
        $inc: { errorCount: 1 },
      },
      { upsert: true, new: true },
    );

    if (updated.errorCount >= TICKER_SYNC_ERROR_THRESHOLD && !updated.hidden) {
      await this.tickerSyncHealthModel.updateOne(
        { _id: updated._id },
        { $set: { hidden: true, hiddenAt: new Date() } },
      );
      return true;
    }

    return false;
  }

  async getHiddenIsins(): Promise<Set<string>> {
    const isins = await this.tickerSyncHealthModel.distinct('isin', {
      hidden: true,
    });
    return new Set(isins);
  }

  async listHidden(): Promise<TickerSyncHealth[]> {
    return this.tickerSyncHealthModel
      .find({ hidden: true })
      .sort({ hiddenAt: -1 })
      .lean<TickerSyncHealth[]>();
  }

  async unhideByTicker(ticker: string): Promise<void> {
    const updated = await this.tickerSyncHealthModel.updateOne(
      { ticker },
      {
        $set: { errorCount: 0, hidden: false },
        $unset: { lastError: '', lastErrorAt: '', hiddenAt: '' },
      },
    );

    if (updated.matchedCount === 0) {
      throw new NotFoundException(`No sync health record for ticker ${ticker}`);
    }
  }
}
