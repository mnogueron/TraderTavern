import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DEFAULT_SYNC_CHUNK_SIZE,
  DEFAULT_SYNC_CONCURRENCY,
  SYNC_CHUNK_SIZE_ENV_VAR,
  SYNC_CONCURRENCY_ENV_VAR,
  TICKER_SYNC_ERROR_THRESHOLD,
} from './constants/candle-windows';
import { SyncType } from './enums/sync-type.enum';
import { SyncKind } from './enums/sync-kind.enum';
import { SyncStatus } from './enums/sync-status.enum';
import { CandleWindow } from './enums/candle-window.enum';
import {
  RateLimitCooldownError,
  YahooRateLimiterService,
  YahooTimeoutError,
} from '../shared/yahoo-rate-limiter.service';
import { AppConfigService } from '../shared/app-config.service';
import { TickerSourceService } from '../ticker-source/ticker-source.service';
import { UserService } from '../user/user.service';
import { MarketHours } from './schemas/market-hours.schema';
import { startOfToday, startOfTomorrow } from './helpers/date-time';
import {
  DailyChartResult,
  fetchCandleChart,
  fetchDailyChart,
  fetchFinancialHistory,
  fetchQuarterlyRevenueHistory,
  fetchQuoteSummary,
} from './helpers/sync-fetchers';
import {
  chunkArray,
  hashIsinChunk,
  runWithConcurrency,
  SyncTrigger,
  TickerRef,
} from './helpers/sync-utils';
import { TickerHealthService } from './ticker-health.service';
import { MarketService } from './market.service';
import { CompoundSyncService } from './compound-sync.service';
import { FundamentalSyncService } from './fundamental-sync.service';
import { StaticSyncService } from './static-sync.service';
import { TechnicalSyncService } from './technical-sync.service';
import { FinancialHistorySyncService } from './financial-history-sync.service';
import { EarningsHistorySyncService } from './earnings-history-sync.service';
import { SyncHistoryRepository } from './repositories/sync-history.repository';
import { SyncHistoryDocument } from './schemas/sync-history.schema';

@Injectable()
export class TickerSyncService {
  private readonly logger = new Logger(TickerSyncService.name);

  constructor(
    private readonly technicalSyncService: TechnicalSyncService,
    private readonly financialHistorySyncService: FinancialHistorySyncService,
    private readonly earningsHistorySyncService: EarningsHistorySyncService,
    private readonly syncHistoryRepository: SyncHistoryRepository,
    private readonly userService: UserService,
    private readonly tickerSourceService: TickerSourceService,
    private readonly configService: AppConfigService,
    private readonly yahooRateLimiter: YahooRateLimiterService,
    private readonly tickerHealthService: TickerHealthService,
    private readonly marketService: MarketService,
    private readonly compoundSyncService: CompoundSyncService,
    private readonly fundamentalSyncService: FundamentalSyncService,
    private readonly staticSyncService: StaticSyncService,
  ) {}

  // Drives the day's full ticker sync one chunk at a time: each tick either
  // claims and processes the next not-yet-done chunk for today, or is a
  // cheap no-op once all of today's chunks are done. Spreads ~8000 tickers
  // out over many hours instead of one long run that would trip Yahoo's
  // rate limiting.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleChunkedTickerSync(): Promise<void> {
    await this.runChunkedSync(
      { type: SyncType.Auto },
      SyncKind.Ticker,
      false,
      (ref) => this.syncTicker(ref, startOfToday()),
    );
  }

  // A sync is considered "started" for today once any chunk of the main
  // ticker sync has been claimed; from then on, the periodic
  // handleChunkedTickerSync cron carries it forward one chunk per tick. This
  // only kicks off the very first chunk immediately (e.g. on first screener
  // load of the day) rather than blocking on the full ~8000-ticker universe.
  async ensureSyncedToday(trigger: SyncTrigger): Promise<void> {
    const alreadyStarted = await this.syncHistoryRepository.hasAnyChunkStarted(
      SyncKind.Ticker,
      startOfToday(),
      startOfTomorrow(),
    );

    if (alreadyStarted) {
      return;
    }

    await this.runChunkedSync(trigger, SyncKind.Ticker, false, (ref) =>
      this.syncTicker(ref, startOfToday()),
    );
  }

  // The set of ISINs any user's configured ticker source actually needs
  // synced: union across every source currently selected by at least one
  // user, deduplicated.
  private async buildIsinUniverse(): Promise<string[]> {
    const sources = await this.userService.getDistinctTickerSources();
    return this.tickerSourceService.getIsinsForSources(sources);
  }

  // Groups the ISIN universe by ticker_static_data.market, then caps each
  // market's group at the configured chunk size (so a large market like
  // NASDAQ still splits into multiple chunks). Grouping by market lets each
  // chunk be gated on that specific market's own session state instead of
  // mixing tickers from unrelated sessions into one arbitrary batch, and
  // makes it easy to see which markets are still outstanding at a glance.
  // ISINs whose market hasn't been resolved yet (e.g. pending their first
  // static sync) fall into a single ungated group so they're never blocked
  // on market hours they don't have yet.
  private async buildMarketChunks(
    isinUniverse: string[],
  ): Promise<{ market: string | null; isins: string[] }[]> {
    const marketByIsin = await this.marketService.getMarketByIsin();

    const isinsByMarket = new Map<string, string[]>();
    const unresolvedIsins: string[] = [];
    for (const isin of isinUniverse) {
      const market = marketByIsin.get(isin);
      if (!market) {
        unresolvedIsins.push(isin);
        continue;
      }
      const group = isinsByMarket.get(market);
      if (group) {
        group.push(isin);
      } else {
        isinsByMarket.set(market, [isin]);
      }
    }

    const chunkSize = this.configService.getNumber(
      SYNC_CHUNK_SIZE_ENV_VAR,
      DEFAULT_SYNC_CHUNK_SIZE,
    );
    const chunks: { market: string | null; isins: string[] }[] = [];
    for (const [market, isinsForMarket] of [...isinsByMarket.entries()].sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      for (const isins of chunkArray(isinsForMarket, chunkSize)) {
        chunks.push({ market, isins });
      }
    }
    for (const isins of chunkArray(unresolvedIsins, chunkSize)) {
      chunks.push({ market: null, isins });
    }

    return chunks;
  }

  // Atomically claims a chunk's "running" slot in sync_history, both via the
  // { syncDate, kind, chunkHash } unique index (this exact chunk hasn't been
  // processed today) and the { kind, status: 'running' } partial unique
  // index (no other chunk of this kind is in flight). Returns null (and
  // logs) if either lock is already held, so callers can skip cleanly.
  private async claimChunkLock(
    trigger: SyncTrigger,
    kind: SyncKind,
    syncDate: Date,
    chunkHash: string,
    tickerCount: number,
    market: string | null,
    isins: string[],
  ): Promise<SyncHistoryDocument | null> {
    const lock = await this.syncHistoryRepository.claimLock(
      trigger,
      kind,
      syncDate,
      chunkHash,
      tickerCount,
      market,
      isins,
    );
    if (!lock) {
      this.logger.warn(
        `Skipping ${kind} chunk sync: already done or in progress`,
      );
    }
    return lock;
  }

  // Marks any "running" lock of this kind older than STALE_LOCK_MS as failed,
  // freeing up both the chunk-hash and the kind-wide "running" slot so a
  // genuinely abandoned sync (e.g. after a process restart) doesn't block
  // all future retries for the rest of the day.
  private async reclaimStaleLocks(kind: SyncKind): Promise<void> {
    const reclaimed = await this.syncHistoryRepository.reclaimStale(kind);
    if (reclaimed > 0) {
      this.logger.warn(`Reclaimed ${reclaimed} stale ${kind} sync lock(s)`);
    }
  }

  // Records a non-fatal per-ticker sync failure against ticker_sync_health
  // so it counts towards TICKER_SYNC_ERROR_THRESHOLD and shows up in the
  // hidden-tickers admin view, regardless of whether the failure happened
  // during ISIN->ticker resolution (no `ticker` yet, so the ISIN itself is
  // used as a placeholder) or during the actual per-ticker sync.
  private recordTickerHealthFailure(ref: TickerRef, error: unknown): void {
    void this.tickerHealthService
      .recordFailure(ref, error)
      .then((justHidden) => {
        if (justHidden) {
          this.logger.warn(
            `Hiding ${ref.ticker} (${ref.isin}) after ${TICKER_SYNC_ERROR_THRESHOLD} consecutive sync failures`,
          );
        }
      })
      .catch((recordError) => {
        this.logger.warn(
          `Failed to record sync health for ${ref.ticker}: ${recordError}`,
        );
      });
  }

  private async finalizeSyncLock(
    lock: SyncHistoryDocument,
    successCount: number,
    errors: Record<string, string>,
    refs: TickerRef[],
    forcedStatus?: SyncStatus,
    generalError?: string,
  ): Promise<void> {
    const resolvedTickers = Object.fromEntries(
      refs.map((ref) => [ref.isin, ref.ticker]),
    );
    await this.syncHistoryRepository.finalize(
      lock._id,
      successCount,
      errors,
      resolvedTickers,
      forcedStatus,
      generalError,
    );
  }

  // Shared driver for every "sync all tickers" operation. Builds the ISIN
  // universe, groups it by market and splits each market's group into
  // size-capped chunks (see buildMarketChunks), skips any chunk whose
  // market hasn't closed yet (for kinds where that matters, see
  // isMarketCloseGated), and for each remaining chunk not already done
  // today: resolves each ISIN to its Yahoo ticker (cached in
  // ticker_sources), fans the given per-ticker sync out across a limited
  // concurrency pool (actual Yahoo request pacing is handled globally by
  // yahooRateLimiter, not per worker), and records the chunk's status.
  //
  // `processAllChunks` controls how much of the universe one call covers:
  // false (the automatic/cron path) processes at most one chunk per call, so
  // a full day's sync is spread across many cron ticks; true (manual admin
  // triggers) processes every remaining chunk before returning, matching the
  // previous blocking-until-done behaviour.
  private async runChunkedSync(
    trigger: SyncTrigger,
    kind: SyncKind,
    processAllChunks: boolean,
    syncTicker: (ref: TickerRef) => Promise<void>,
    markets?: string[],
  ): Promise<void> {
    await this.reclaimStaleLocks(kind);

    const fullIsinUniverse = await this.buildIsinUniverse();
    if (fullIsinUniverse.length === 0) {
      return;
    }

    const hiddenIsins = await this.tickerHealthService.getHiddenIsins();
    const isinUniverse = fullIsinUniverse.filter(
      (isin) => !hiddenIsins.has(isin),
    );
    if (hiddenIsins.size > 0) {
      this.logger.log(
        `${kind} sync: skipping ${fullIsinUniverse.length - isinUniverse.length} hidden ISIN(s) ` +
          `(${TICKER_SYNC_ERROR_THRESHOLD}+ consecutive failures)`,
      );
    }
    if (isinUniverse.length === 0) {
      return;
    }

    const syncDate = startOfToday();
    const allMarketChunks = await this.buildMarketChunks(isinUniverse);
    const marketChunks = markets?.length
      ? allMarketChunks.filter(
          (chunk) => chunk.market && markets.includes(chunk.market),
        )
      : allMarketChunks;
    if (marketChunks.length === 0) {
      return;
    }

    const closeGated = this.marketService.isMarketCloseGated(kind);
    const marketHoursByCode = closeGated
      ? await this.marketService.getMarketHoursByCode()
      : new Map<string, MarketHours>();

    for (const { market, isins: isinChunk } of marketChunks) {
      if (
        closeGated &&
        !this.marketService.isMarketDueForSync(market, marketHoursByCode)
      ) {
        continue;
      }

      const chunkHash = hashIsinChunk(isinChunk);
      const alreadyDone = await this.syncHistoryRepository.isChunkDone(
        syncDate,
        kind,
        chunkHash,
      );
      if (alreadyDone) {
        continue;
      }

      const lock = await this.claimChunkLock(
        trigger,
        kind,
        syncDate,
        chunkHash,
        isinChunk.length,
        market,
        isinChunk,
      );
      if (!lock) {
        if (!processAllChunks) {
          return;
        }
        continue;
      }

      const chunkStartedAt = Date.now();
      this.logger.log(
        `Starting ${kind} chunk sync for market ${market ?? 'unknown'}: ${isinChunk.length} ISIN(s) (lock ${lock._id})`,
      );

      const refs: TickerRef[] = [];
      const errors: Record<string, string> = {};
      let resolutionAbortStatus: SyncStatus | null = null;
      let generalError: string | null = null;
      let resolved = 0;
      for (const isin of isinChunk) {
        try {
          const ticker =
            await this.tickerSourceService.resolveYahooTicker(isin);
          if (ticker) {
            refs.push({ isin, ticker });
          } else {
            const message = 'No Yahoo ticker could be resolved for this ISIN';
            errors[isin] = message;
            // No resolved Yahoo ticker exists yet for this ISIN, so there's
            // no real `ticker` value to key the health record on; the ISIN
            // itself is used as a placeholder so this still counts towards
            // TICKER_SYNC_ERROR_THRESHOLD and surfaces in the hidden-tickers
            // admin view instead of being retried forever, invisibly.
            this.recordTickerHealthFailure(
              { isin, ticker: isin },
              new Error(message),
            );
          }
        } catch (error) {
          errors[isin] = error instanceof Error ? error.message : String(error);

          if (error instanceof RateLimitCooldownError) {
            this.logger.warn(
              `Aborting ${kind} chunk sync during ISIN resolution after sustained Yahoo rate limiting on ${isin}: ${error.message}`,
            );
            resolutionAbortStatus = SyncStatus.Failed;
            generalError = error.message;
            break;
          }
          if (error instanceof YahooTimeoutError) {
            this.logger.warn(
              `Aborting ${kind} chunk sync during ISIN resolution after a request timeout on ${isin}: ${error.message}`,
            );
            resolutionAbortStatus = SyncStatus.Timeout;
            generalError = error.message;
            break;
          }

          this.logger.warn(
            `Failed to resolve Yahoo ticker for ${isin}: ${error}`,
          );
          this.recordTickerHealthFailure({ isin, ticker: isin }, error);
        }

        resolved += 1;
        if (resolved % 25 === 0 || resolved === isinChunk.length) {
          this.logger.log(
            `${kind} chunk sync: resolved ${resolved}/${isinChunk.length} ISIN(s) ` +
              `(${Date.now() - chunkStartedAt}ms elapsed)`,
          );
        }
      }

      if (resolutionAbortStatus) {
        await this.finalizeSyncLock(
          lock,
          0,
          errors,
          refs,
          resolutionAbortStatus,
          generalError ?? undefined,
        );
        this.logger.log(
          `Finished ${kind} chunk sync for market ${market ?? 'unknown'} in ${Date.now() - chunkStartedAt}ms: ` +
            `aborted during ISIN resolution (status=${resolutionAbortStatus})`,
        );
        if (!processAllChunks) {
          return;
        }
        continue;
      }

      this.logger.log(
        `${kind} chunk sync: ISIN resolution done in ${Date.now() - chunkStartedAt}ms, ` +
          `syncing ${refs.length} ticker(s)`,
      );

      let synced = 0;
      const syncStartedAt = Date.now();
      // A rate-limit cooldown or request timeout is treated as fatal for
      // the whole chunk rather than just the current ticker: burning
      // through the rest of the chunk at the same failure mode either
      // keeps hammering an already-rate-limited Yahoo, or (per the timeout
      // investigation) individually times out on every remaining request
      // because the client-side request queue is still jammed behind a
      // hung call. Either way, stopping immediately and letting the chunk
      // cool down until the next sync attempt is cheaper and safer.
      let abortStatus: SyncStatus | null = null;
      let syncGeneralError: string | null = null;
      const successCount = await runWithConcurrency(
        refs,
        this.configService.getNumber(
          SYNC_CONCURRENCY_ENV_VAR,
          DEFAULT_SYNC_CONCURRENCY,
        ),
        async (ref) => {
          await syncTicker(ref);
          await this.tickerHealthService.recordSuccess(ref);
          synced += 1;
          if (synced % 25 === 0 || synced === refs.length) {
            this.logger.log(
              `${kind} chunk sync: synced ${synced}/${refs.length} ticker(s) ` +
                `(${Date.now() - syncStartedAt}ms elapsed)`,
            );
          }
        },
        (ref, error) => {
          errors[ref.isin] =
            error instanceof Error ? error.message : String(error);

          if (error instanceof RateLimitCooldownError) {
            this.logger.warn(
              `Aborting ${kind} chunk sync after sustained Yahoo rate limiting on ${ref.ticker}: ${error.message}`,
            );
            abortStatus = SyncStatus.Failed;
            syncGeneralError = error.message;
            return;
          }
          if (error instanceof YahooTimeoutError) {
            this.logger.warn(
              `Aborting ${kind} chunk sync after a request timeout on ${ref.ticker}: ${error.message}`,
            );
            abortStatus = SyncStatus.Timeout;
            syncGeneralError = error.message;
            return;
          }

          this.logger.warn(
            `Failed to sync ${kind} for ${ref.ticker}: ${error}`,
          );
          this.recordTickerHealthFailure(ref, error);
        },
        () => abortStatus !== null,
      );

      await this.finalizeSyncLock(
        lock,
        successCount,
        errors,
        refs,
        abortStatus ?? undefined,
        syncGeneralError ?? undefined,
      );

      this.logger.log(
        `Finished ${kind} chunk sync for market ${market ?? 'unknown'} in ${Date.now() - chunkStartedAt}ms: ` +
          `${successCount}/${refs.length} succeeded, ${Object.keys(errors).length} error(s)` +
          (abortStatus ? `, aborted early (status=${abortStatus})` : ''),
      );

      if (!processAllChunks) {
        return;
      }
    }
  }

  async syncAll(trigger: SyncTrigger, markets?: string[]): Promise<void> {
    await this.runChunkedSync(
      trigger,
      SyncKind.Ticker,
      true,
      (ref) => this.syncTicker(ref, startOfToday()),
      markets,
    );
  }

  async syncAllFundamental(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(trigger, SyncKind.Fundamental, true, (ref) =>
      this.syncFundamental(ref, startOfToday()),
    );
  }

  async syncAllCompound(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(trigger, SyncKind.Compound, true, (ref) =>
      this.syncCompound(ref, startOfToday()),
    );
  }

  async syncAllStatic(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(trigger, SyncKind.Static, true, (ref) =>
      this.syncStatic(ref),
    );
  }

  async syncAllTechnical(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(trigger, SyncKind.Technical, true, (ref) =>
      this.syncTechnical(ref),
    );
  }

  async syncSingleTickerStatic(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    await this.syncStatic(ref);
  }

  async syncSingleTickerFundamental(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    await this.syncFundamental(ref, startOfToday());
  }

  async syncSingleTickerCompound(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    await this.syncCompound(ref, startOfToday());
  }

  async syncSingleTickerTechnical(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    await this.syncTechnical(ref);
  }

  // Wraps a single-ticker admin sync with the same sync_history logging as
  // the chunked syncs, under its own SyncKind.SingleTicker so it doesn't
  // contend for the chunked cron's per-kind lock. Uses a random chunk hash
  // (rather than one derived from the ISIN alone) so the same ticker can be
  // resynced multiple times a day without tripping the idempotency index;
  // the { kind, status: 'running' } lock still ensures only one
  // single-ticker sync runs at a time.
  async syncSingleTicker(isin: string, trigger: SyncTrigger): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    const marketByIsin = await this.marketService.getMarketByIsin();
    const market = marketByIsin.get(ref.isin) ?? null;
    const syncDate = startOfToday();

    const lock = await this.syncHistoryRepository.claimLock(
      trigger,
      SyncKind.SingleTicker,
      syncDate,
      hashIsinChunk([ref.isin, randomUUID()]),
      1,
      market,
      [ref.isin],
    );
    if (!lock) {
      throw new ConflictException(
        'A single-ticker sync is already running, try again shortly',
      );
    }

    try {
      await this.syncTicker(ref, syncDate);
      await this.tickerHealthService.recordSuccess(ref);
      await this.syncHistoryRepository.finalize(lock._id, 1, {}, {
        [ref.isin]: ref.ticker,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordTickerHealthFailure(ref, error);
      await this.syncHistoryRepository.finalize(
        lock._id,
        0,
        { [ref.isin]: message },
        { [ref.isin]: ref.ticker },
      );
      throw error;
    }
  }

  private async syncTicker(ref: TickerRef, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      fetchQuoteSummary(this.yahooRateLimiter, ref.ticker),
      fetchDailyChart(this.yahooRateLimiter, ref.ticker),
    ]);

    const marketCap =
      quoteSummary.summaryDetail?.marketCap ?? quoteSummary.price?.marketCap;
    const { periods, piotroskiScore, altmanZScore } =
      await fetchFinancialHistory(this.yahooRateLimiter, ref.ticker, marketCap);
    const revenue = await fetchQuarterlyRevenueHistory(
      this.yahooRateLimiter,
      ref.ticker,
    );

    await this.staticSyncService.update(ref, quoteSummary);
    await this.compoundSyncService.update(ref, syncDate, quoteSummary, chart);
    await this.financialHistorySyncService.update(ref, periods);
    await this.fundamentalSyncService.update(
      ref,
      syncDate,
      quoteSummary,
      piotroskiScore,
      altmanZScore,
    );
    await this.earningsHistorySyncService.update(ref, quoteSummary, revenue);
    await this.syncTechnical(ref);
  }

  private async syncTechnical(ref: TickerRef): Promise<void> {
    const chartsByWindow = new Map<CandleWindow, DailyChartResult>();
    for (const window of Object.values(CandleWindow)) {
      const chart = await fetchCandleChart(
        this.yahooRateLimiter,
        ref.ticker,
        this.technicalSyncService.getLookbackDate(window),
        window,
      );
      chartsByWindow.set(window, chart);
    }

    await this.technicalSyncService.syncTechnical(ref, chartsByWindow);
  }

  private async syncStatic(ref: TickerRef): Promise<void> {
    const quoteSummary = await fetchQuoteSummary(
      this.yahooRateLimiter,
      ref.ticker,
    );

    await this.staticSyncService.update(ref, quoteSummary);
  }

  private async syncCompound(ref: TickerRef, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      fetchQuoteSummary(this.yahooRateLimiter, ref.ticker),
      fetchDailyChart(this.yahooRateLimiter, ref.ticker),
    ]);

    await this.compoundSyncService.update(ref, syncDate, quoteSummary, chart);
  }

  private async syncFundamental(ref: TickerRef, syncDate: Date): Promise<void> {
    const quoteSummary = await fetchQuoteSummary(
      this.yahooRateLimiter,
      ref.ticker,
    );

    await this.fundamentalSyncService.update(ref, syncDate, quoteSummary);
  }
}
