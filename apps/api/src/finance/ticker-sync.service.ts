import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import YahooFinance from 'yahoo-finance2';
import {
  CANDLE_COUNT_ENV_VAR,
  CANDLE_LOOKBACK_MULTIPLIER,
  CANDLE_WINDOW_DURATION_MS,
  DEFAULT_CANDLE_COUNT,
  DEFAULT_SYNC_CHUNK_SIZE,
  DEFAULT_SYNC_CONCURRENCY,
  SYNC_CHUNK_SIZE_ENV_VAR,
  SYNC_CONCURRENCY_ENV_VAR,
  TICKER_SYNC_ERROR_THRESHOLD,
} from './constants/candle-windows';
import { SyncType } from './enums/sync-type.enum';
import { SyncKind } from './enums/sync-kind.enum';
import { CandleWindow } from './enums/candle-window.enum';
import { YahooRateLimiterService } from '../shared/yahoo-rate-limiter.service';
import { TickerSourceService } from '../ticker-source/ticker-source.service';
import { UserService } from '../user/user.service';
import { MarketHours } from './schemas/market-hours.schema';
import {
  AltmanPeriodDraft,
  AnnualFinancialPeriodDraft,
  FundamentalsTimeSeriesRow,
  PiotroskiPeriodDraft,
  computeAltmanZScore,
  computePiotroskiScore,
} from './helpers/financial-helpers';
import { computeTechnicalIndicators } from './helpers/technical-indicators';
import {
  chunkArray,
  hashIsinChunk,
  runWithConcurrency,
  startOfToday,
  startOfTomorrow,
  SyncTrigger,
  TickerRef,
} from './helpers/sync-utils';
import { TickerHealthService } from './ticker-health.service';
import { TickerStaticDataRepository } from './repositories/ticker-static-data.repository';
import { CompoundTechnicalDataRepository } from './repositories/compound-technical-data.repository';
import { FundamentalDataRepository } from './repositories/fundamental-data.repository';
import { TechnicalDataRepository } from './repositories/technical-data.repository';
import { FinancialHistoryRepository } from './repositories/financial-history.repository';
import { EarningsHistoryRepository } from './repositories/earnings-history.repository';
import { MarketHoursRepository } from './repositories/market-hours.repository';
import { SyncHistoryRepository } from './repositories/sync-history.repository';
import { SyncHistoryDocument } from './schemas/sync-history.schema';

const yahooFinance = new YahooFinance();

// Covers just over a year of calendar days lookback, so the 1y/YTD change
// calculations always have a reference close to compare against.
const HISTORY_LOOKBACK_DAYS = 400;

// How far back to pull the Financial History (annual) and Earnings History
// (quarterly revenue) charts.
const FINANCIAL_HISTORY_YEARS = 6;
const QUARTERLY_REVENUE_HISTORY_YEARS = 2;

@Injectable()
export class TickerSyncService {
  private readonly logger = new Logger(TickerSyncService.name);

  constructor(
    private readonly tickerStaticDataRepository: TickerStaticDataRepository,
    private readonly compoundTechnicalDataRepository: CompoundTechnicalDataRepository,
    private readonly fundamentalDataRepository: FundamentalDataRepository,
    private readonly technicalDataRepository: TechnicalDataRepository,
    private readonly financialHistoryRepository: FinancialHistoryRepository,
    private readonly earningsHistoryRepository: EarningsHistoryRepository,
    private readonly marketHoursRepository: MarketHoursRepository,
    private readonly syncHistoryRepository: SyncHistoryRepository,
    private readonly userService: UserService,
    private readonly tickerSourceService: TickerSourceService,
    private readonly configService: ConfigService,
    private readonly yahooRateLimiter: YahooRateLimiterService,
    private readonly tickerHealthService: TickerHealthService,
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

  // Refreshes tickers whose market has just closed for the day, so
  // changePercent1d reflects today's official close (vs the daily cron,
  // which only runs pre-market and always sees yesterday's close).
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEndOfDayRefresh(): Promise<void> {
    const syncDate = startOfToday();
    const [staticData, marketHours] = await Promise.all([
      this.tickerStaticDataRepository.findAllRefsWithMarket(),
      this.marketHoursRepository.findAll(),
    ]);
    const marketHoursByCode = new Map(
      marketHours.map((hours) => [hours.market, hours]),
    );

    const dueTickers: TickerRef[] = [];
    for (const { isin, ticker, market } of staticData) {
      const hours = market ? marketHoursByCode.get(market) : undefined;
      if (!hours || !this.isPastRegularClose(hours)) {
        continue;
      }

      const alreadySynced = await this.compoundTechnicalDataRepository.existsForDate(
        isin,
        syncDate,
      );
      if (!alreadySynced) {
        dueTickers.push({ isin, ticker });
      }
    }

    await runWithConcurrency(
      dueTickers,
      this.getSyncConcurrency(),
      (ref) => this.syncCompound(ref, syncDate),
      (ref, error) => {
        this.logger.warn(`Failed end-of-day sync for ${ref.ticker}: ${error}`);
      },
    );
  }

  private isPastRegularClose(hours: MarketHours): boolean {
    const localTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: hours.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());

    // Once local time has wrapped past midnight into the next calendar
    // day, today's regular session (which always closes before midnight)
    // is necessarily long over. Comparing "HH:mm" strings naively would
    // read e.g. "00:39" as earlier than a "17:30" close and wrongly treat
    // the market as still open, so also treat any time before the next
    // open as past-close.
    return localTime >= hours.regularClose || localTime < hours.regularOpen;
  }

  // Calendar date (YYYY-MM-DD) of `date` in `timezone` (UTC if omitted),
  // used to tell whether a daily candle belongs to "today" regardless of
  // what time the sync happens to run at.
  private calendarDateKey(date: Date, timezone?: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone ?? 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
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

  private getSyncConcurrency(): number {
    const raw = this.configService.get<string>(SYNC_CONCURRENCY_ENV_VAR);
    const parsed = raw != null ? Number(raw) : undefined;
    return parsed != null && Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_SYNC_CONCURRENCY;
  }

  private getSyncChunkSize(): number {
    const raw = this.configService.get<string>(SYNC_CHUNK_SIZE_ENV_VAR);
    const parsed = raw != null ? Number(raw) : undefined;
    return parsed != null && Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_SYNC_CHUNK_SIZE;
  }

  // The set of ISINs any user's configured ticker source actually needs
  // synced: union across every source currently selected by at least one
  // user, deduplicated.
  private async buildIsinUniverse(): Promise<string[]> {
    const sources = await this.userService.getDistinctTickerSources();
    return this.tickerSourceService.getIsinsForSources(sources);
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
  ): Promise<SyncHistoryDocument | null> {
    const lock = await this.syncHistoryRepository.claimLock(
      trigger,
      kind,
      syncDate,
      chunkHash,
      tickerCount,
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

  private async finalizeSyncLock(
    lock: SyncHistoryDocument,
    successCount: number,
    errors: Record<string, string>,
  ): Promise<void> {
    await this.syncHistoryRepository.finalize(lock._id, successCount, errors);
  }

  // Shared driver for every "sync all tickers" operation. Builds the ISIN
  // universe, splits it into fixed-size chunks, and for each chunk not
  // already done today: resolves each ISIN to its Yahoo ticker (cached in
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
  ): Promise<void> {
    await this.reclaimStaleLocks(kind);

    const fullIsinUniverse = await this.buildIsinUniverse();
    if (fullIsinUniverse.length === 0) {
      return;
    }

    const hiddenIsins = await this.tickerHealthService.getHiddenIsins();
    const isinUniverse = fullIsinUniverse.filter((isin) => !hiddenIsins.has(isin));
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
    const chunks = chunkArray(isinUniverse, this.getSyncChunkSize());

    for (const isinChunk of chunks) {
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
      );
      if (!lock) {
        if (!processAllChunks) {
          return;
        }
        continue;
      }

      const chunkStartedAt = Date.now();
      this.logger.log(
        `Starting ${kind} chunk sync: ${isinChunk.length} ISIN(s) (lock ${lock._id})`,
      );

      const refs: TickerRef[] = [];
      const errors: Record<string, string> = {};
      let resolved = 0;
      for (const isin of isinChunk) {
        try {
          const ticker = await this.tickerSourceService.resolveYahooTicker(isin);
          if (ticker) {
            refs.push({ isin, ticker });
          } else {
            errors[isin] = 'No Yahoo ticker could be resolved for this ISIN';
          }
        } catch (error) {
          this.logger.warn(`Failed to resolve Yahoo ticker for ${isin}: ${error}`);
          errors[isin] = error instanceof Error ? error.message : String(error);
        }

        resolved += 1;
        if (resolved % 25 === 0 || resolved === isinChunk.length) {
          this.logger.log(
            `${kind} chunk sync: resolved ${resolved}/${isinChunk.length} ISIN(s) ` +
              `(${Date.now() - chunkStartedAt}ms elapsed)`,
          );
        }
      }

      this.logger.log(
        `${kind} chunk sync: ISIN resolution done in ${Date.now() - chunkStartedAt}ms, ` +
          `syncing ${refs.length} ticker(s)`,
      );

      let synced = 0;
      const syncStartedAt = Date.now();
      const successCount = await runWithConcurrency(
        refs,
        this.getSyncConcurrency(),
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
          this.logger.warn(`Failed to sync ${kind} for ${ref.ticker}: ${error}`);
          errors[ref.ticker] = error instanceof Error ? error.message : String(error);
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
        },
      );

      await this.finalizeSyncLock(lock, successCount, errors);

      this.logger.log(
        `Finished ${kind} chunk sync in ${Date.now() - chunkStartedAt}ms: ` +
          `${successCount}/${refs.length} succeeded, ${Object.keys(errors).length} error(s)`,
      );

      if (!processAllChunks) {
        return;
      }
    }
  }

  async syncAll(trigger: SyncTrigger): Promise<void> {
    await this.runChunkedSync(trigger, SyncKind.Ticker, true, (ref) =>
      this.syncTicker(ref, startOfToday()),
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

  // Admin single-ticker sync endpoints are addressed by Yahoo ticker symbol
  // rather than ISIN; resolve the ISIN once so the rest of the sync
  // pipeline can key its writes by it like every other sync path.
  private async resolveRefForTicker(ticker: string): Promise<TickerRef> {
    const isin = await this.tickerSourceService.findIsinByYahooTicker(ticker);
    if (!isin) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }
    return { isin, ticker };
  }

  async syncSingleTickerStatic(ticker: string): Promise<void> {
    const ref = await this.resolveRefForTicker(ticker);
    await this.syncStatic(ref);
  }

  async syncSingleTickerFundamental(ticker: string): Promise<void> {
    const ref = await this.resolveRefForTicker(ticker);
    await this.syncFundamental(ref, startOfToday());
  }

  async syncSingleTickerCompound(ticker: string): Promise<void> {
    const ref = await this.resolveRefForTicker(ticker);
    await this.syncCompound(ref, startOfToday());
  }

  async syncSingleTickerTechnical(ticker: string): Promise<void> {
    const ref = await this.resolveRefForTicker(ticker);
    await this.syncTechnical(ref);
  }

  async syncSingleTicker(ticker: string): Promise<void> {
    const ref = await this.resolveRefForTicker(ticker);
    await this.syncTicker(ref, startOfToday());
  }

  private async fetchQuoteSummary(ticker: string) {
    return this.yahooRateLimiter.schedule(() =>
      yahooFinance.quoteSummary(ticker, {
        modules: [
          'price',
          'summaryDetail',
          'assetProfile',
          'financialData',
          'defaultKeyStatistics',
          'earningsHistory',
        ],
      }),
    );
  }

  private async fetchDailyChart(ticker: string) {
    return this.yahooRateLimiter.schedule(() =>
      yahooFinance.chart(ticker, {
        period1: new Date(
          Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        ),
        interval: '1d',
      }),
    );
  }

  private async fetchFinancialHistory(ticker: string, marketCap?: number) {
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - FINANCIAL_HISTORY_YEARS);

    const [financials, cashFlow, balanceSheet] = await Promise.all([
      this.yahooRateLimiter.schedule(
        () =>
          yahooFinance.fundamentalsTimeSeries(ticker, {
            period1,
            type: 'annual',
            module: 'financials',
          }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
      ),
      this.yahooRateLimiter.schedule(
        () =>
          yahooFinance.fundamentalsTimeSeries(ticker, {
            period1,
            type: 'annual',
            module: 'cash-flow',
          }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
      ),
      this.yahooRateLimiter.schedule(
        () =>
          yahooFinance.fundamentalsTimeSeries(ticker, {
            period1,
            type: 'annual',
            module: 'balance-sheet',
          }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
      ),
    ]);

    const byPeriodEnd = new Map<string, AnnualFinancialPeriodDraft>();
    const getOrCreate = (date: Date): AnnualFinancialPeriodDraft => {
      const key = date.toISOString();
      let entry = byPeriodEnd.get(key);
      if (!entry) {
        entry = { periodEnd: date };
        byPeriodEnd.set(key, entry);
      }
      return entry;
    };

    const piotroskiByPeriodEnd = new Map<string, PiotroskiPeriodDraft>();
    const getOrCreatePiotroski = (date: Date): PiotroskiPeriodDraft => {
      const key = date.toISOString();
      let entry = piotroskiByPeriodEnd.get(key);
      if (!entry) {
        entry = { periodEnd: date };
        piotroskiByPeriodEnd.set(key, entry);
      }
      return entry;
    };

    const altmanByPeriodEnd = new Map<string, AltmanPeriodDraft>();
    const getOrCreateAltman = (date: Date): AltmanPeriodDraft => {
      const key = date.toISOString();
      let entry = altmanByPeriodEnd.get(key);
      if (!entry) {
        entry = { periodEnd: date };
        altmanByPeriodEnd.set(key, entry);
      }
      return entry;
    };

    for (const row of financials) {
      const entry = getOrCreate(row.date);
      entry.revenue = row.totalRevenue;
      entry.ebitda = row.EBITDA;
      entry.netIncome = row.netIncome;

      const piotroski = getOrCreatePiotroski(row.date);
      piotroski.revenue = row.totalRevenue;
      piotroski.netIncome = row.netIncome;
      piotroski.grossProfit = row.grossProfit;

      const altman = getOrCreateAltman(row.date);
      altman.revenue = row.totalRevenue;
      altman.ebit = row.EBIT;
    }
    for (const row of cashFlow) {
      const entry = getOrCreate(row.date);
      entry.operatingCashflow = row.operatingCashFlow;
      entry.freeCashflow = row.freeCashFlow;
      entry.capex = row.capitalExpenditure;

      const piotroski = getOrCreatePiotroski(row.date);
      piotroski.operatingCashflow = row.operatingCashFlow;
    }
    for (const row of balanceSheet) {
      const entry = getOrCreate(row.date);
      entry.cash = row.cashAndCashEquivalents;
      entry.totalDebt = row.totalDebt;
      entry.netDebt = row.netDebt;

      const piotroski = getOrCreatePiotroski(row.date);
      piotroski.totalAssets = row.totalAssets;
      piotroski.currentAssets = row.currentAssets;
      piotroski.currentLiabilities = row.currentLiabilities;
      piotroski.longTermDebt = row.longTermDebt;
      piotroski.sharesOutstanding = row.ordinarySharesNumber ?? row.shareIssued;

      const altman = getOrCreateAltman(row.date);
      altman.totalAssets = row.totalAssets;
      altman.currentAssets = row.currentAssets;
      altman.currentLiabilities = row.currentLiabilities;
      altman.retainedEarnings = row.retainedEarnings;
      altman.totalLiabilities = row.totalLiabilitiesNetMinorityInterest;
    }

    const piotroskiPeriods = Array.from(piotroskiByPeriodEnd.values()).sort(
      (a, b) => a.periodEnd.getTime() - b.periodEnd.getTime(),
    );
    const [priorPiotroskiPeriod, latestPiotroskiPeriod] =
      piotroskiPeriods.slice(-2);
    const piotroskiScore =
      latestPiotroskiPeriod && priorPiotroskiPeriod
        ? computePiotroskiScore(latestPiotroskiPeriod, priorPiotroskiPeriod)
        : undefined;

    const latestAltmanPeriod = Array.from(altmanByPeriodEnd.values()).sort(
      (a, b) => a.periodEnd.getTime() - b.periodEnd.getTime(),
    ).at(-1);
    const altmanZScore = latestAltmanPeriod
      ? computeAltmanZScore(latestAltmanPeriod, marketCap)
      : undefined;

    return {
      periods: Array.from(byPeriodEnd.values()).sort(
        (a, b) => a.periodEnd.getTime() - b.periodEnd.getTime(),
      ),
      piotroskiScore,
      altmanZScore,
    };
  }

  private async fetchQuarterlyRevenueHistory(
    ticker: string,
  ): Promise<{ quarter: Date; actual?: number }[]> {
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - QUARTERLY_REVENUE_HISTORY_YEARS);

    const rows = (await this.yahooRateLimiter.schedule(
      () =>
        yahooFinance.fundamentalsTimeSeries(ticker, {
          period1,
          type: 'quarterly',
          module: 'financials',
        }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
    )) as FundamentalsTimeSeriesRow[];

    return rows.map((row) => ({
      quarter: row.date,
      actual: row.totalRevenue,
    }));
  }

  private async syncTicker(ref: TickerRef, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      this.fetchQuoteSummary(ref.ticker),
      this.fetchDailyChart(ref.ticker),
    ]);

    await this.updateStaticData(ref, quoteSummary);
    await this.updateCompound(ref, syncDate, quoteSummary, chart);
    const marketCap =
      quoteSummary.summaryDetail?.marketCap ?? quoteSummary.price?.marketCap;
    const { piotroskiScore, altmanZScore } = await this.updateFinancialHistory(
      ref,
      marketCap,
    );
    await this.updateFundamental(
      ref,
      syncDate,
      quoteSummary,
      piotroskiScore,
      altmanZScore,
    );
    await this.updateEarningsHistory(ref, quoteSummary);
    await this.syncTechnical(ref);
  }

  private async updateFinancialHistory(
    ref: TickerRef,
    marketCap?: number,
  ): Promise<{ piotroskiScore?: number; altmanZScore?: number }> {
    const { periods, piotroskiScore, altmanZScore } =
      await this.fetchFinancialHistory(ref.ticker, marketCap);

    await this.financialHistoryRepository.upsertAnnual(ref, periods);

    return { piotroskiScore, altmanZScore };
  }

  private async updateEarningsHistory(
    ref: TickerRef,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
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
    const revenue = await this.fetchQuarterlyRevenueHistory(ref.ticker);

    await this.earningsHistoryRepository.upsert(ref, eps, revenue);
  }

  private async syncStatic(ref: TickerRef): Promise<void> {
    const quoteSummary = await this.fetchQuoteSummary(ref.ticker);

    await this.updateStaticData(ref, quoteSummary);
  }

  private async updateStaticData(
    ref: TickerRef,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
  ): Promise<void> {
    const { price, assetProfile, defaultKeyStatistics } = quoteSummary;
    const companyName = price?.longName ?? price?.shortName ?? ref.ticker;
    const website = assetProfile?.website;
    const logoUrl = website ? this.logoUrlFromWebsite(website) : undefined;

    await this.tickerStaticDataRepository.upsert(ref, {
      companyName,
      sector: assetProfile?.sector,
      industry: assetProfile?.industry,
      country: assetProfile?.country,
      description: assetProfile?.longBusinessSummary,
      market: price?.exchange,
      currency: price?.currency,
      website,
      logoUrl,
      employees: assetProfile?.fullTimeEmployees,
      fiscalYearEnd: defaultKeyStatistics?.lastFiscalYearEnd,
      mostRecentQuarter: defaultKeyStatistics?.mostRecentQuarter,
    });
  }

  private logoUrlFromWebsite(website: string): string | undefined {
    try {
      const hostname = new URL(website).hostname.replace(/^www\./, '');
      return `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
    } catch {
      return undefined;
    }
  }

  private async syncTechnical(ref: TickerRef): Promise<void> {
    for (const window of Object.values(CandleWindow)) {
      await this.syncCandles(ref, window);
    }
  }

  private async syncCompound(ref: TickerRef, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      this.fetchQuoteSummary(ref.ticker),
      this.fetchDailyChart(ref.ticker),
    ]);

    await this.updateCompound(ref, syncDate, quoteSummary, chart);
  }

  private async syncFundamental(ref: TickerRef, syncDate: Date): Promise<void> {
    const quoteSummary = await this.fetchQuoteSummary(ref.ticker);

    await this.updateFundamental(ref, syncDate, quoteSummary);
  }

  private async updateCompound(
    ref: TickerRef,
    syncDate: Date,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
    chart: Awaited<ReturnType<typeof this.fetchDailyChart>>,
  ): Promise<void> {
    const { price } = quoteSummary;

    const quotes = (chart.quotes ?? []).filter(
      (quote): quote is typeof quote & { close: number } =>
        quote.close != null,
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
      ? await this.marketHoursRepository.findByMarket(price.exchange)
      : null;
    const isClosedToday = hours != null && this.isPastRegularClose(hours);

    // While a session is open, Yahoo's daily chart already includes today's
    // candle with a non-null (live, still-moving) close, so it isn't a
    // "completed session" yet. The `quotes.close != null` filter above
    // doesn't exclude it, which used to shift `.at(-1)`/`.at(-2)` by one day
    // and made the "market still open" branch below compare yesterday's
    // close against itself (via two different data sources) instead of
    // against the day before. Strip today's candle before any positional
    // lookup so `.at(-1)`/`.at(-2)` always point at completed sessions.
    const todayKey = this.calendarDateKey(new Date(), hours?.timezone);
    const completedQuotes = quotes.filter(
      (quote) => this.calendarDateKey(quote.date, hours?.timezone) !== todayKey,
    );

    // "anchor": the most recent completed session's close — today's once
    // the market has closed for the day, otherwise yesterday's. The closed
    // branch's fallback intentionally uses the raw `quotes` (not
    // `completedQuotes`), since once the market closes, today's candle is
    // exactly what we want to pick up there.
    const anchorClose = isClosedToday
      ? (price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null)
      : (price?.regularMarketPreviousClose ?? completedQuotes.at(-1)?.close ?? null);
    // "prior": the completed session immediately before the anchor. Always
    // uses `completedQuotes`, since "prior" is never today regardless of
    // branch.
    const priorClose = isClosedToday
      ? (price?.regularMarketPreviousClose ?? completedQuotes.at(-1)?.close ?? null)
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

  private async updateFundamental(
    ref: TickerRef,
    syncDate: Date,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
    piotroskiScore?: number,
    altmanZScore?: number,
  ): Promise<void> {
    const { price, summaryDetail, financialData, defaultKeyStatistics } =
      quoteSummary;

    // These scores only change with annual filings and are freshly computed
    // by updateFinancialHistory as part of the full ticker sync; on syncs
    // that don't recompute them (e.g. the fundamental-only cadence), carry
    // the last known values forward instead of dropping them from that
    // day's snapshot.
    const previousFundamental =
      piotroskiScore == null || altmanZScore == null
        ? await this.fundamentalDataRepository.findLatestScores(ref.isin)
        : null;
    const resolvedPiotroskiScore =
      piotroskiScore ?? previousFundamental?.piotroskiScore;
    const resolvedAltmanZScore =
      altmanZScore ?? previousFundamental?.altmanZScore;

    const totalRevenue = financialData?.totalRevenue;
    const freeCashflow = financialData?.freeCashflow;
    const operatingCashflow = financialData?.operatingCashflow;
    const marketCap = summaryDetail?.marketCap ?? price?.marketCap;
    const ebitda = financialData?.ebitda;
    const totalDebt = financialData?.totalDebt;
    const totalCash = financialData?.totalCash;

    const capex =
      operatingCashflow != null && freeCashflow != null
        ? operatingCashflow - freeCashflow
        : undefined;
    const fcfMargin =
      freeCashflow != null && totalRevenue
        ? (freeCashflow / totalRevenue) * 100
        : undefined;
    const fcfYield =
      freeCashflow != null && marketCap
        ? (freeCashflow / marketCap) * 100
        : undefined;
    const netDebt =
      totalDebt != null && totalCash != null
        ? totalDebt - totalCash
        : undefined;
    const netDebtToEbitda =
      netDebt != null && ebitda ? netDebt / ebitda : undefined;

    // Yahoo returns these as fractions (e.g. 0.4865 for 48.65%); convert to
    // percentage points, matching the existing changePercent* convention.
    const toPercent = (value: number | undefined): number | undefined =>
      value != null ? value * 100 : undefined;

    await this.fundamentalDataRepository.upsert(ref, syncDate, {
      marketCap,
      peRatio: summaryDetail?.trailingPE,
          psRatio: summaryDetail?.priceToSalesTrailing12Months,
          ebitda,
          totalDebt,
          totalCash,
          debtToEquity: financialData?.debtToEquity,

          // Company
          enterpriseValue: defaultKeyStatistics?.enterpriseValue,
          revenue: totalRevenue,
          grossProfit: financialData?.grossProfits,
          netIncome: defaultKeyStatistics?.netIncomeToCommon,
          revenuePerShare: financialData?.revenuePerShare,

          // Valuation
          forwardPE: summaryDetail?.forwardPE ?? defaultKeyStatistics?.forwardPE,
          pegRatio: defaultKeyStatistics?.pegRatio,
          evToEbitda: defaultKeyStatistics?.enterpriseToEbitda,
          evToRevenue: defaultKeyStatistics?.enterpriseToRevenue,
          priceToBook: defaultKeyStatistics?.priceToBook,
          epsTrailing: defaultKeyStatistics?.trailingEps,
          epsForward: defaultKeyStatistics?.forwardEps,

          // 52W range
          fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow,

          // Profitability
          grossMargin: toPercent(financialData?.grossMargins),
          operatingMargin: toPercent(financialData?.operatingMargins),
          ebitdaMargin: toPercent(financialData?.ebitdaMargins),
          profitMargin: toPercent(
            financialData?.profitMargins ?? defaultKeyStatistics?.profitMargins,
          ),
          returnOnEquity: toPercent(financialData?.returnOnEquity),
          returnOnAssets: toPercent(financialData?.returnOnAssets),

          // Growth
          revenueGrowth: toPercent(financialData?.revenueGrowth),
          earningsGrowth: toPercent(financialData?.earningsGrowth),

          // Cash flow & leverage
          operatingCashflow,
          freeCashflow,
          capex,
          fcfMargin,
          fcfYield,
          netDebt,
          netDebtToEbitda,

          // Balance sheet
          currentRatio: financialData?.currentRatio,
          quickRatio: financialData?.quickRatio,
          bookValuePerShare: defaultKeyStatistics?.bookValue,
          cashPerShare: financialData?.totalCashPerShare,

          // Dividends
          forwardDividendRate: summaryDetail?.dividendRate,
          trailingDividendRate: summaryDetail?.trailingAnnualDividendRate,
          dividendYield: toPercent(summaryDetail?.dividendYield),
          fiveYearAvgDividendYield: summaryDetail?.fiveYearAvgDividendYield,
          payoutRatio: toPercent(summaryDetail?.payoutRatio),
          exDividendDate: summaryDetail?.exDividendDate,

          // Analyst consensus
          analystRating: financialData?.recommendationKey,
          analystTargetMean: financialData?.targetMeanPrice,
          analystTargetLow: financialData?.targetLowPrice,
          analystTargetHigh: financialData?.targetHighPrice,
          analystCount: financialData?.numberOfAnalystOpinions,

          // Ownership
          sharesOutstanding: defaultKeyStatistics?.sharesOutstanding,
          floatShares: defaultKeyStatistics?.floatShares,
          insidersPercent: toPercent(defaultKeyStatistics?.heldPercentInsiders),
          institutionsPercent: toPercent(
            defaultKeyStatistics?.heldPercentInstitutions,
          ),

          // Quality
          piotroskiScore: resolvedPiotroskiScore,
          altmanZScore: resolvedAltmanZScore,

          // Technical (directly from Yahoo, no computation)
          sma50: summaryDetail?.fiftyDayAverage,
          sma200: summaryDetail?.twoHundredDayAverage,
          beta: summaryDetail?.beta ?? defaultKeyStatistics?.beta,
          sp500Change52w: toPercent(defaultKeyStatistics?.SandP52WeekChange),
          avgVolume30d: summaryDetail?.averageVolume,
      avgVolume10d:
        summaryDetail?.averageVolume10days ??
        summaryDetail?.averageDailyVolume10Day,
    });
  }

  private getCandleCount(window: CandleWindow): number {
    const raw = this.configService.get<string>(CANDLE_COUNT_ENV_VAR[window]);
    const parsed = raw != null ? Number(raw) : undefined;
    return parsed != null && Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_CANDLE_COUNT[window];
  }

  private async syncCandles(
    ref: TickerRef,
    window: CandleWindow,
  ): Promise<void> {
    const count = this.getCandleCount(window);
    const lookbackMs =
      count * CANDLE_WINDOW_DURATION_MS[window] * CANDLE_LOOKBACK_MULTIPLIER;

    const chart = await this.yahooRateLimiter.schedule(() =>
      yahooFinance.chart(ref.ticker, {
        period1: new Date(Date.now() - lookbackMs),
        interval: window,
      }),
    );

    const candles = (chart.quotes ?? [])
      .filter(
        (quote): quote is typeof quote & {
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
