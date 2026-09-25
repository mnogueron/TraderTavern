import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DEFAULT_TICKER_SYNC_ERROR_THRESHOLD,
  TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR,
} from './constants/candle-windows';
import {
  TickerSyncHealth,
  TickerSyncHealthDocument,
} from './schemas/ticker-sync-health.schema';
import { TickerRef } from './helpers/sync-utils';
import { AppConfigService } from '../shared/app-config.service';

// Error messages that indicate a ticker will never succeed on retry (e.g.
// the ISIN has no resolvable Yahoo ticker at all, or Yahoo's response shape
// doesn't match what the library expects), as opposed to transient network
// or rate-limit issues. These hide the ticker on the very first occurrence
// instead of waiting for TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR retries that
// would just reproduce the same error every time.
const PERMANENT_FAILURE_PATTERNS = [
  /no yahoo ticker could be resolved for this isin/i,
  /failed yahoo schema validation/i,
];

function isPermanentFailure(message: string): boolean {
  return PERMANENT_FAILURE_PATTERNS.some((pattern) => pattern.test(message));
}

// Tracks per-ISIN sync health so a persistently broken ticker is excluded
// from future automated sync attempts instead of being retried forever (see
// TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR). A single shared service backs both
// the sync job (recordSuccess/recordFailure/getHiddenIsins) and the settings
// UI (listHidden/unhideByTicker).
@Injectable()
export class TickerHealthService {
  constructor(
    @InjectModel(TickerSyncHealth.name)
    private readonly tickerSyncHealthModel: Model<TickerSyncHealthDocument>,
    private readonly configService: AppConfigService,
  ) {}

  // `isFullSync` distinguishes a full ticker sync (static + compound +
  // financial history + fundamental + earnings + technical, see
  // TickerSyncService.syncTicker) from a partial sync of a single data kind
  // (e.g. compound-only): only a full sync actually refreshes all the
  // EOD-relevant data, so only it advances `lastFullSyncedAt`.
  async recordSuccess(ref: TickerRef, isFullSync: boolean): Promise<void> {
    await this.tickerSyncHealthModel.updateOne(
      { isin: ref.isin },
      {
        $set: {
          isin: ref.isin,
          ticker: ref.ticker,
          errorCount: 0,
          hidden: false,
          ...(isFullSync ? { lastFullSyncedAt: new Date() } : {}),
        },
        $unset: { lastError: '', lastErrorAt: '', hiddenAt: '' },
      },
      { upsert: true },
    );
  }

  // Increments the error counter for this ISIN and hides it once the
  // counter reaches TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR, or immediately if
  // the error is a known-permanent failure (see isPermanentFailure). Returns
  // whether this call just hid the ticker, so callers can log it.
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

    const threshold = this.configService.getNumber(
      TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR,
      DEFAULT_TICKER_SYNC_ERROR_THRESHOLD,
    );
    const shouldHide =
      !updated.hidden &&
      (updated.errorCount >= threshold || isPermanentFailure(message));

    if (shouldHide) {
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

  // Used by the sync health monitor to tell whether each ticker's EOD data
  // has been refreshed since its market closed (see
  // FinanceService.computeTickerHealthEntries). Tickers with no health
  // record yet (never synced at all) are simply absent from the map.
  async getLastFullSyncedByIsin(): Promise<Map<string, Date | undefined>> {
    const docs = await this.tickerSyncHealthModel
      .find({}, 'isin lastFullSyncedAt')
      .lean();
    return new Map(docs.map((doc) => [doc.isin, doc.lastFullSyncedAt]));
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
