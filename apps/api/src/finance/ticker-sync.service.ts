import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DEFAULT_SYNC_CHUNK_SIZE,
  DEFAULT_SYNC_CONCURRENCY,
  DEFAULT_SYNC_SMALL_MARKET_LIMIT,
  DEFAULT_SYNC_TIMEOUT_COOLDOWN_MINUTES,
  DEFAULT_TICKER_SYNC_ERROR_THRESHOLD,
  SYNC_CHUNK_SIZE_ENV_VAR,
  SYNC_CONCURRENCY_ENV_VAR,
  SYNC_SMALL_MARKET_LIMIT_ENV_VAR,
  SYNC_TIMEOUT_COOLDOWN_MINUTES_ENV_VAR,
  TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR,
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
import {
  calendarDateKey,
  startOfToday,
  startOfTomorrow,
} from './helpers/date-time';
import {
  DailyChartResult,
  fetchCandleChart,
  fetchDailyChart,
  fetchFinancialHistory,
  fetchMarketMeta,
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
import { MarketHoursSyncService } from './market-hours-sync.service';
import { MarketHours } from './schemas/market-hours.schema';
import { CompoundSyncService } from './compound-sync.service';
import { FundamentalSyncService } from './fundamental-sync.service';
import { StaticSyncService } from './static-sync.service';
import { TechnicalSyncService } from './technical-sync.service';
import { FinancialHistorySyncService } from './financial-history-sync.service';
import { EarningsHistorySyncService } from './earnings-history-sync.service';
import { SyncHistoryRepository } from './repositories/sync-history.repository';
import { SyncHistoryDocument } from './schemas/sync-history.schema';

@Injectable()
export class TickerSyncService implements OnModuleInit {
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
    private readonly marketHoursSyncService: MarketHoursSyncService,
    private readonly compoundSyncService: CompoundSyncService,
    private readonly fundamentalSyncService: FundamentalSyncService,
    private readonly staticSyncService: StaticSyncService,
  ) {}

  // Any sync_history doc still "running" at startup can only be a lock left
  // behind by a previous process that died mid-sync (this process holds no
  // in-memory record of it), so it's cleared unconditionally rather than
  // waiting out reclaimStaleLocks' 30-minute age gate — otherwise a restart
  // right after a chunk was claimed would leave that kind's
  // { kind, status: 'running' } lock stuck for up to 30 minutes, blocking
  // any new sync of that kind in the meantime.
  async onModuleInit(): Promise<void> {
    const reclaimed =
      await this.syncHistoryRepository.cancelAllRunningOnStartup();
    if (reclaimed > 0) {
      this.logger.warn(
        `Reclaimed ${reclaimed} running sync lock(s) left over from a prior server process`,
      );
    }
  }

  // Drives the day's full ticker sync one chunk at a time: each tick either
  // claims and processes the next not-yet-done chunk for today, or is a
  // cheap no-op once all of today's chunks are done. Actual Yahoo request
  // pacing (not this interval) is what protects against rate limiting, and a
  // 200-ticker chunk only takes a few minutes against that shared limiter
  // (see YahooRateLimiterService), so this ticks far more often than a chunk
  // takes to run: the { kind, status: 'running' } lock makes the no-op ticks
  // cheap, and a full day's sync now approaches the rate limiter's own
  // throughput ceiling instead of being bottlenecked by this interval.
  @Cron(CronExpression.EVERY_MINUTE)
  async handleChunkedTickerSync(): Promise<void> {
    await this.runChunkedSync(
      { type: SyncType.Auto },
      SyncKind.Ticker,
      false,
      (ref, syncDate) => this.syncTicker(ref, syncDate),
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

    await this.runChunkedSync(
      trigger,
      SyncKind.Ticker,
      false,
      (ref, syncDate) => this.syncTicker(ref, syncDate),
    );
  }

  // The set of ISINs any user's configured ticker source actually needs
  // synced: union across every source currently selected by at least one
  // user, deduplicated.
  private async buildIsinUniverse(): Promise<string[]> {
    const sources = await this.userService.getDistinctTickerSources();
    return this.tickerSourceService.getIsinsForSources(sources);
  }

  // Reads SYNC_CHUNK_SIZE, treating -1 as "unbounded" so buildChunks puts
  // every market's whole ISIN group into a single chunk. Read directly
  // rather than via configService.getNumber, since that helper falls back to
  // the default for any value <= 0.
  private getChunkSize(): number {
    const raw = this.configService.get<string>(SYNC_CHUNK_SIZE_ENV_VAR);
    if (raw === '-1') {
      return Number.POSITIVE_INFINITY;
    }
    return this.configService.getNumber(
      SYNC_CHUNK_SIZE_ENV_VAR,
      DEFAULT_SYNC_CHUNK_SIZE,
    );
  }

  // Groups the ISIN universe by ticker_static_data.market (no chunk-size
  // splitting yet, no market-hours dependency — see buildChunks for that).
  // ISINs whose market hasn't been resolved yet (e.g. pending their first
  // static sync) are returned separately so they can fall into a single
  // ungated group that's never blocked on market hours they don't have yet.
  private async groupIsinsByMarket(isinUniverse: string[]): Promise<{
    isinsByMarket: Map<string, string[]>;
    unresolvedIsins: string[];
  }> {
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

    return { isinsByMarket, unresolvedIsins };
  }

  // Backfills market_hours for any market in this run's universe that
  // doesn't have one yet, so a newly-seen exchange code doesn't sit
  // permanently "unconfigured" (see MarketService.isMarketDueForSync/
  // closingSyncDate falling back to "always due"/startOfToday for it). Runs
  // once per runChunkedSync call, before chunks are built, using a single
  // representative ticker per missing market rather than fetching this for
  // every ticker. Mutates `marketHoursByCode` in place so a market
  // discovered this run is immediately gated/dated correctly for the rest of
  // this same call. Best-effort: a market that can't be resolved yet (e.g.
  // ISIN resolution or the Yahoo request fails) is simply left unconfigured
  // and retried on the next sync.
  private async discoverMissingMarketHours(
    isinsByMarket: Map<string, string[]>,
    marketHoursByCode: Map<string, MarketHours>,
  ): Promise<void> {
    for (const [market, isins] of isinsByMarket) {
      if (marketHoursByCode.has(market) || isins.length === 0) {
        continue;
      }

      try {
        const ticker = await this.tickerSourceService.resolveYahooTicker(
          isins[0],
        );
        if (!ticker) {
          continue;
        }
        const meta = await fetchMarketMeta(this.yahooRateLimiter, ticker);
        const hours = await this.marketHoursSyncService.upsertFromChartMeta(
          market,
          meta,
        );
        marketHoursByCode.set(market, hours);
        this.logger.log(
          `Discovered market hours for ${market} (${hours.label}) from Yahoo`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to discover market hours for ${market}: ${error}`,
        );
      }
    }
  }

  // Splits the (already market-grouped, market-hours-aware) ISIN universe
  // into the actual sync_history chunks for this run. Markets not currently
  // due (when `closeGated`) produce no chunk this run. Markets at or above
  // the small-market threshold are chunked individually via chunkArray,
  // exactly like before this feature existed. Markets below the threshold
  // are instead greedily packed (sorted by market code for determinism, and
  // grouped by their close instant's UTC calendar day so different-day
  // closes are never combined) into chunks capped at the configured chunk
  // size, each tagged with every constituent market and the *max* of their
  // closing instants (see the aggregated-syncDate rationale in
  // helpers/date-time.ts's regularCloseAt and the feature's design notes —
  // markets close in tight clusters, so the latest real close instant stays
  // meaningful rather than a synthetic rounded value). `syncDateByIsin`
  // preserves each ISIN's own market's real close instant regardless of how
  // its chunk was formed, so per-ticker EOD data is never tagged with
  // another market's date. Unresolved-market ISINs always get their own
  // always-due, ungated, never-aggregated chunk(s).
  private buildChunks(
    isinsByMarket: Map<string, string[]>,
    unresolvedIsins: string[],
    marketHoursByCode: Map<string, MarketHours>,
    closeGated: boolean,
  ): {
    markets: string[];
    isins: string[];
    syncDate: Date;
    syncDateByIsin: Map<string, Date>;
    marketByIsin: Map<string, string>;
  }[] {
    const chunkSize = this.getChunkSize();
    const smallMarketLimit = this.configService.getNumber(
      SYNC_SMALL_MARKET_LIMIT_ENV_VAR,
      DEFAULT_SYNC_SMALL_MARKET_LIMIT,
    );
    const smallMarketThreshold = Math.min(smallMarketLimit, chunkSize);

    const chunks: {
      markets: string[];
      isins: string[];
      syncDate: Date;
      syncDateByIsin: Map<string, Date>;
      marketByIsin: Map<string, string>;
    }[] = [];

    const smallMarketEntries: {
      market: string;
      isins: string[];
      closingDate: Date;
      dayKey: string;
    }[] = [];

    for (const [market, isins] of [...isinsByMarket.entries()].sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      if (
        closeGated &&
        !this.marketService.isMarketDueForSync(market, marketHoursByCode)
      ) {
        continue;
      }

      const closingDate = this.marketService.closingSyncDate(
        market,
        marketHoursByCode,
      );

      if (isins.length >= smallMarketThreshold) {
        for (const isinChunk of chunkArray(isins, chunkSize)) {
          chunks.push({
            markets: [market],
            isins: isinChunk,
            syncDate: closingDate,
            syncDateByIsin: new Map(
              isinChunk.map((isin) => [isin, closingDate]),
            ),
            marketByIsin: new Map(isinChunk.map((isin) => [isin, market])),
          });
        }
      } else {
        smallMarketEntries.push({
          market,
          isins,
          closingDate,
          dayKey: calendarDateKey(closingDate),
        });
      }
    }

    const smallMarketEntriesByDay = new Map<string, typeof smallMarketEntries>();
    for (const entry of smallMarketEntries) {
      const entries = smallMarketEntriesByDay.get(entry.dayKey);
      if (entries) {
        entries.push(entry);
      } else {
        smallMarketEntriesByDay.set(entry.dayKey, [entry]);
      }
    }

    for (const entries of smallMarketEntriesByDay.values()) {
      let current: {
        markets: string[];
        isins: string[];
        syncDateByIsin: Map<string, Date>;
        marketByIsin: Map<string, string>;
        maxClosingDate: Date;
      } | null = null;

      const flush = () => {
        if (current) {
          chunks.push({
            markets: current.markets,
            isins: current.isins,
            syncDate: current.maxClosingDate,
            syncDateByIsin: current.syncDateByIsin,
            marketByIsin: current.marketByIsin,
          });
        }
        current = null;
      };

      for (const entry of entries) {
        if (current && current.isins.length + entry.isins.length > chunkSize) {
          flush();
        }
        if (!current) {
          current = {
            markets: [],
            isins: [],
            syncDateByIsin: new Map(),
            marketByIsin: new Map(),
            maxClosingDate: entry.closingDate,
          };
        }
        current.markets.push(entry.market);
        current.isins.push(...entry.isins);
        for (const isin of entry.isins) {
          current.syncDateByIsin.set(isin, entry.closingDate);
          current.marketByIsin.set(isin, entry.market);
        }
        if (entry.closingDate > current.maxClosingDate) {
          current.maxClosingDate = entry.closingDate;
        }
      }
      flush();
    }

    const unresolvedClosingDate = this.marketService.closingSyncDate(
      null,
      marketHoursByCode,
    );
    for (const isinChunk of chunkArray(unresolvedIsins, chunkSize)) {
      chunks.push({
        markets: [],
        isins: isinChunk,
        syncDate: unresolvedClosingDate,
        syncDateByIsin: new Map(
          isinChunk.map((isin) => [isin, unresolvedClosingDate]),
        ),
        marketByIsin: new Map(),
      });
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
    markets: string[],
    isins: string[],
  ): Promise<SyncHistoryDocument | null> {
    const lock = await this.syncHistoryRepository.claimLock(
      trigger,
      kind,
      syncDate,
      chunkHash,
      tickerCount,
      markets,
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

  // Immediately cancels the given sync job if it's still "running", freeing
  // its lock. Mainly useful for a job orphaned by a server restart or
  // crashed process, but works on any running job — unlike
  // reclaimStaleLocks, this is triggered on-demand by an admin, targeting
  // one specific job, rather than gated behind STALE_LOCK_MS.
  async cancelJob(id: string): Promise<boolean> {
    const cancelled = await this.syncHistoryRepository.cancelIfRunning(id);
    if (cancelled) {
      this.logger.warn(`Cancelled sync job ${id} on admin request`);
    }
    return cancelled;
  }

  // Records a non-fatal per-ticker sync failure against ticker_sync_health
  // so it counts towards TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR and shows up in
  // the hidden-tickers admin view, regardless of whether the failure
  // happened during ISIN->ticker resolution (no `ticker` yet, so the ISIN
  // itself is used as a placeholder) or during the actual per-ticker sync.
  private recordTickerHealthFailure(ref: TickerRef, error: unknown): void {
    void this.tickerHealthService
      .recordFailure(ref, error)
      .then((justHidden) => {
        if (justHidden) {
          const threshold = this.configService.getNumber(
            TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR,
            DEFAULT_TICKER_SYNC_ERROR_THRESHOLD,
          );
          this.logger.warn(
            `Hiding ${ref.ticker} (${ref.isin}) after ${threshold} consecutive sync failures`,
          );
        }
      })
      .catch((recordError) => {
        this.logger.warn(
          `Failed to record sync health for ${ref.ticker}: ${recordError}`,
        );
      });
  }

  // Records that this ISIN just timed out, purely to gate the short retry
  // cooldown (see SYNC_TIMEOUT_COOLDOWN_MINUTES_ENV_VAR) — deliberately kept
  // separate from recordTickerHealthFailure so timeouts never count towards
  // TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR.
  private recordTickerTimeout(ref: TickerRef): void {
    void this.tickerHealthService.recordTimeout(ref).catch((recordError) => {
      this.logger.warn(
        `Failed to record sync timeout for ${ref.ticker}: ${recordError}`,
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
  // size-capped chunks (see buildChunks), skips any chunk whose
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
    syncTicker: (ref: TickerRef, syncDate: Date) => Promise<void>,
    markets?: string[],
  ): Promise<void> {
    await this.reclaimStaleLocks(kind);

    const fullIsinUniverse = await this.buildIsinUniverse();
    if (fullIsinUniverse.length === 0) {
      return;
    }

    // A manual trigger scoped to specific markets is an explicit admin
    // request to (re)sync exactly those markets, so it also retries tickers
    // that auto-hid themselves after repeated failures (the same override a
    // per-ticker "sync now" already gets, see syncSingleTicker) instead of
    // silently excluding them like the unscoped automatic sync does.
    let isinUniverse = fullIsinUniverse;
    if (!markets?.length) {
      const hiddenIsins = await this.tickerHealthService.getHiddenIsins();
      isinUniverse = fullIsinUniverse.filter((isin) => !hiddenIsins.has(isin));
      if (hiddenIsins.size > 0) {
        const threshold = this.configService.getNumber(
          TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR,
          DEFAULT_TICKER_SYNC_ERROR_THRESHOLD,
        );
        this.logger.log(
          `${kind} sync: skipping ${fullIsinUniverse.length - isinUniverse.length} hidden ISIN(s) ` +
            `(${threshold}+ consecutive failures)`,
        );
      }
    }
    if (isinUniverse.length === 0) {
      return;
    }

    const { isinsByMarket: allIsinsByMarket, unresolvedIsins: allUnresolvedIsins } =
      await this.groupIsinsByMarket(isinUniverse);

    // A manual admin trigger restricted to specific markets drops unresolved
    // ISINs entirely (there's no market to match against), matching the
    // previous per-chunk filter's behavior.
    const isinsByMarket = markets?.length
      ? new Map(
          [...allIsinsByMarket.entries()].filter(([market]) =>
            markets.includes(market),
          ),
        )
      : allIsinsByMarket;
    const unresolvedIsins = markets?.length ? [] : allUnresolvedIsins;
    if (isinsByMarket.size === 0 && unresolvedIsins.length === 0) {
      if (markets?.length) {
        this.logger.warn(
          `${kind} sync: no tickers found for requested market(s) ${markets.join(', ')}`,
        );
      }
      return;
    }

    const closeGated = this.marketService.isMarketCloseGated(kind);
    const marketHoursByCode = await this.marketService.getMarketHoursByCode();
    await this.discoverMissingMarketHours(isinsByMarket, marketHoursByCode);

    const chunks = this.buildChunks(
      isinsByMarket,
      unresolvedIsins,
      marketHoursByCode,
      closeGated,
    );
    if (chunks.length === 0) {
      if (markets?.length) {
        this.logger.warn(
          `${kind} sync: ${markets.join(', ')} not due for sync yet (market still in its regular session)`,
        );
      }
      return;
    }

    // A full ticker sync (see syncTicker) is the only kind that stamps
    // lastFullSyncedAt on success, so it's the only one where "already
    // succeeded for this closing" can be told apart from "never attempted"
    // without touching a prior, never-reused sync_history doc (see
    // claimLock). Used below to narrow a retried chunk down to just the
    // ISINs that failed or were never reached last time, instead of
    // redoing ISINs that already have fresh EOD data.
    const lastFullSyncedByIsin =
      kind === SyncKind.Ticker
        ? await this.tickerHealthService.getLastFullSyncedByIsin()
        : new Map<string, Date | undefined>();

    // Keeps a persistently slow/hanging ticker from being retried on every
    // single EVERY_MINUTE cron tick (which would just abort the same chunk
    // again and again) — see recordTickerTimeout.
    const timeoutCooldownMs =
      this.configService.getNumber(
        SYNC_TIMEOUT_COOLDOWN_MINUTES_ENV_VAR,
        DEFAULT_SYNC_TIMEOUT_COOLDOWN_MINUTES,
      ) * 60_000;
    const lastTimeoutByIsin = await this.tickerHealthService.getLastTimeoutByIsin();

    for (const {
      markets: fullChunkMarkets,
      isins: fullIsinChunk,
      syncDate,
      syncDateByIsin,
      marketByIsin,
    } of chunks) {
      const fullMarketLabel =
        fullChunkMarkets.length > 0 ? fullChunkMarkets.join('+') : 'unknown';

      const isinChunk = fullIsinChunk.filter((isin) => {
        if (kind === SyncKind.Ticker) {
          const lastSynced = lastFullSyncedByIsin.get(isin);
          const dueDate = syncDateByIsin.get(isin);
          if (lastSynced && dueDate && lastSynced >= dueDate) {
            return false;
          }
        }

        const lastTimeout = lastTimeoutByIsin.get(isin);
        if (lastTimeout && Date.now() - lastTimeout.getTime() < timeoutCooldownMs) {
          return false;
        }

        return true;
      });
      if (isinChunk.length === 0) {
        if (markets?.length) {
          this.logger.warn(
            `${kind} sync: ${fullMarketLabel} already synced for ${syncDate.toISOString()}`,
          );
        }
        continue;
      }
      if (isinChunk.length < fullIsinChunk.length) {
        this.logger.log(
          `${kind} chunk sync: skipping ${fullIsinChunk.length - isinChunk.length} ISIN(s) already synced or cooling down after a recent timeout for market ${fullMarketLabel}`,
        );
      }

      // Narrowed down to only the markets that actually still have a
      // surviving ISIN in this chunk after the filter above — otherwise an
      // aggregated small-market chunk would keep reporting every market it
      // was originally bundled with (e.g. 16 markets) even after 15 of them
      // had every ISIN filtered out, leaving a single-ticker chunk falsely
      // tagged with all 16.
      const chunkMarkets = fullChunkMarkets.filter((market) =>
        isinChunk.some((isin) => marketByIsin.get(isin) === market),
      );
      const marketLabel =
        chunkMarkets.length > 0 ? chunkMarkets.join('+') : 'unknown';

      const chunkHash = hashIsinChunk(isinChunk);
      const alreadyDone = await this.syncHistoryRepository.isChunkDone(
        syncDate,
        kind,
        chunkHash,
      );
      if (alreadyDone) {
        if (markets?.length) {
          this.logger.warn(
            `${kind} sync: ${marketLabel} already synced for ${syncDate.toISOString()}`,
          );
        }
        continue;
      }

      const lock = await this.claimChunkLock(
        trigger,
        kind,
        syncDate,
        chunkHash,
        isinChunk.length,
        chunkMarkets,
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
        `Starting ${kind} chunk sync for market ${marketLabel}: ${isinChunk.length} ISIN(s) (lock ${lock._id})`,
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
            // TICKER_SYNC_ERROR_THRESHOLD_ENV_VAR and surfaces in the hidden-tickers
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
          } else if (error instanceof YahooTimeoutError) {
            // A single ISIN's request timing out doesn't mean the rest of
            // the chunk will too (in practice it's an isolated Yahoo/network
            // hiccup on that one symbol, not a jammed shared queue) — so
            // only this ISIN is skipped, recorded for its own cooldown (see
            // recordTickerTimeout), and resolution continues with the rest
            // of the chunk instead of aborting it entirely.
            this.logger.warn(
              `Failed to resolve Yahoo ticker for ${isin} after a request timeout: ${error.message}`,
            );
            this.recordTickerTimeout({ isin, ticker: isin });
          } else {
            this.logger.warn(
              `Failed to resolve Yahoo ticker for ${isin}: ${error}`,
            );
            this.recordTickerHealthFailure({ isin, ticker: isin }, error);
          }
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
          `Finished ${kind} chunk sync for market ${marketLabel} in ${Date.now() - chunkStartedAt}ms: ` +
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
      // A rate-limit cooldown is treated as fatal for the whole chunk:
      // burning through the rest of it at the same failure mode just keeps
      // hammering an already-rate-limited Yahoo, so stopping immediately and
      // letting the chunk cool down until the next sync attempt is cheaper
      // and safer. A single ticker's request timeout, by contrast, is not
      // chunk-fatal — investigation of real sync_history data showed
      // timeouts land on isolated, unrelated ISINs rather than a jammed
      // shared request queue, so only that one ticker is skipped (and put on
      // its own cooldown, see recordTickerTimeout) while the rest of the
      // chunk keeps going.
      let abortStatus: SyncStatus | null = null;
      let syncGeneralError: string | null = null;
      const successCount = await runWithConcurrency(
        refs,
        this.configService.getNumber(
          SYNC_CONCURRENCY_ENV_VAR,
          DEFAULT_SYNC_CONCURRENCY,
        ),
        async (ref) => {
          const isinSyncDate = syncDateByIsin.get(ref.isin);
          if (!isinSyncDate) {
            throw new Error(
              `No syncDate found for ${ref.isin} in chunk ${lock._id} — this indicates a bug in buildChunks`,
            );
          }
          await syncTicker(ref, isinSyncDate);
          await this.tickerHealthService.recordSuccess(
            ref,
            kind === SyncKind.Ticker,
          );
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
              `Failed to sync ${kind} for ${ref.ticker} after a request timeout: ${error.message}`,
            );
            this.recordTickerTimeout(ref);
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
        `Finished ${kind} chunk sync for market ${marketLabel} in ${Date.now() - chunkStartedAt}ms: ` +
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
      (ref, syncDate) => this.syncTicker(ref, syncDate),
      markets,
    );
  }

  async syncAllFundamental(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(
      trigger,
      SyncKind.Fundamental,
      true,
      (ref, syncDate) => this.syncFundamental(ref, syncDate),
    );
  }

  async syncAllCompound(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(
      trigger,
      SyncKind.Compound,
      true,
      (ref, syncDate) => this.syncCompound(ref, syncDate),
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
    const syncDate = await this.resolveClosingSyncDate(ref.isin);
    await this.syncFundamental(ref, syncDate);
  }

  async syncSingleTickerCompound(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    const syncDate = await this.resolveClosingSyncDate(ref.isin);
    await this.syncCompound(ref, syncDate);
  }

  async syncSingleTickerTechnical(isin: string): Promise<void> {
    const ref = await this.tickerSourceService.resolveRefForIsin(isin);
    await this.syncTechnical(ref);
  }

  // The UTC instant a single-ticker sync should be tagged with: the isin's
  // market's own closing time, same as a chunked sync would use.
  private async resolveClosingSyncDate(isin: string): Promise<Date> {
    const marketByIsin = await this.marketService.getMarketByIsin();
    const market = marketByIsin.get(isin) ?? null;
    const marketHoursByCode = await this.marketService.getMarketHoursByCode();
    return this.marketService.closingSyncDate(market, marketHoursByCode);
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
    const marketHoursByCode = await this.marketService.getMarketHoursByCode();
    const syncDate = this.marketService.closingSyncDate(
      market,
      marketHoursByCode,
    );

    const lock = await this.syncHistoryRepository.claimLock(
      trigger,
      SyncKind.SingleTicker,
      syncDate,
      hashIsinChunk([ref.isin, randomUUID()]),
      1,
      market ? [market] : [],
      [ref.isin],
    );
    if (!lock) {
      throw new ConflictException(
        'A single-ticker sync is already running, try again shortly',
      );
    }

    try {
      await this.syncTicker(ref, syncDate);
      await this.tickerHealthService.recordSuccess(ref, true);
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
