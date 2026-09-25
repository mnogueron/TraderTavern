import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Fuse from 'fuse.js';
import { UserService } from '../user/user.service';
import {
  TickerSource,
  TickerSourceDocument,
} from '../ticker-source/schemas/ticker-source.schema';
import { TickerDto } from './dto/Ticker.dto';
import { FundamentalTickerDto } from './dto/FundamentalTicker.dto';
import { CandleDto } from './dto/Candle.dto';
import { TickerChartDto } from './dto/TickerChart.dto';
import { SyncType } from './enums/sync-type.enum';
import { CandleWindow } from './enums/candle-window.enum';
import { TickerSyncService } from './ticker-sync.service';
import { TickerHealthService } from './ticker-health.service';
import { MarketService } from './market.service';
import { AppConfigService } from '../shared/app-config.service';
import { HiddenTickerDto } from './dto/HiddenTicker.dto';
import { GetHiddenTickersDto } from './dto/GetHiddenTickers.dto';
import { PaginatedHiddenTickerDto } from './dto/PaginatedHiddenTicker.dto';
import { GetSyncHealthDto } from './dto/GetSyncHealth.dto';
import { TickerSyncHealthDto } from './dto/TickerSyncHealth.dto';
import { PaginatedTickerSyncHealthDto } from './dto/PaginatedTickerSyncHealth.dto';
import { SyncHealthSummaryDto } from './dto/SyncHealthSummary.dto';
import { SyncHealthStatus } from './enums/sync-health-status.enum';
import { SyncHealthReason } from './enums/sync-health-reason.enum';
import {
  TICKER_STALE_THRESHOLD_MINUTES_ENV_VAR,
  DEFAULT_TICKER_STALE_THRESHOLD_MINUTES,
} from './constants/candle-windows';
import { calendarDateKey, minutesPastRegularClose } from './helpers/date-time';
import {
  TickerStaticData,
  TickerStaticDataDocument,
} from './schemas/ticker-static-data.schema';
import {
  CompoundTechnicalTickerData,
  CompoundTechnicalTickerDataDocument,
} from './schemas/compound-technical-ticker-data.schema';
import {
  FundamentalTickerData,
  FundamentalTickerDataDocument,
} from './schemas/fundamental-ticker-data.schema';
import {
  TechnicalTickerData,
  TechnicalTickerDataDocument,
} from './schemas/technical-ticker-data.schema';
import {
  MarketHours,
  MarketHoursDocument,
} from './schemas/market-hours.schema';
import { MarketHoursDto } from './dto/MarketHours.dto';
import { MarketSummaryDto } from './dto/MarketSummary.dto';
import { TickerOptionDto } from './dto/TickerOption.dto';
import {
  AnnualFinancialPeriodDto,
  FinancialHistoryDto,
} from './dto/FinancialHistory.dto';
import {
  EarningsHistoryDto,
  EpsPeriodDto,
  RevenuePeriodDto,
} from './dto/EarningsHistory.dto';
import { AltmanHistoryDto, AltmanScorePointDto } from './dto/AltmanHistory.dto';
import {
  TickerFinancialHistory,
  TickerFinancialHistoryDocument,
} from './schemas/ticker-financial-history.schema';
import {
  TickerEarningsHistory,
  TickerEarningsHistoryDocument,
} from './schemas/ticker-earnings-history.schema';
import { GetScreenerDto } from './dto/GetScreener.dto';
import { GetScreenerTickerOptionsDto } from './dto/GetScreenerTickerOptions.dto';
import { PaginatedTickerDto } from './dto/PaginatedTicker.dto';
import { PaginatedTickerOptionDto } from './dto/PaginatedTickerOption.dto';
import { ScreenerFilterOptionsDto } from './dto/ScreenerFilterOptions.dto';
import { SyncStatusDto } from './dto/SyncStatus.dto';
import {
  SyncHistory,
  SyncHistoryDocument,
} from './schemas/sync-history.schema';
import { SyncStatus } from './enums/sync-status.enum';
import { SyncHistoryRepository } from './repositories/sync-history.repository';
import { SyncHistoryListItemDto } from './dto/SyncHistoryListItem.dto';
import { SyncHistoryDetailDto } from './dto/SyncHistoryDetail.dto';
import { SyncHistoryTickerDto } from './dto/SyncHistoryTicker.dto';
import { PaginatedSyncHistoryDto } from './dto/PaginatedSyncHistory.dto';
import { TickerSyncStatus } from './enums/ticker-sync-status.enum';
import { GetSyncHistoryDto } from './dto/GetSyncHistory.dto';
import {
  applyScreenerFilters,
  parseScreenerFilters,
  sortScreenerTickers,
} from './screener-filters';

type WithUpdatedAt = { updatedAt: Date };
type WithTimestamps = { createdAt: Date; updatedAt: Date };

type TickerHealthEntry = {
  isin: string;
  ticker: string;
  companyName: string | null;
  logoUrl: string | null;
  market: string | null;
  marketLabel: string | null;
  lastFullSyncedAt: Date | null;
  minutesPastClose: number | null;
  status: SyncHealthStatus;
  reason: SyncHealthReason | null;
};

@Injectable()
export class FinanceService {
  constructor(
    private readonly tickerSyncService: TickerSyncService,
    private readonly tickerHealthService: TickerHealthService,
    private readonly marketService: MarketService,
    private readonly configService: AppConfigService,
    private readonly userService: UserService,
    @InjectModel(TickerSource.name)
    private readonly tickerSourceModel: Model<TickerSourceDocument>,
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
    @InjectModel(CompoundTechnicalTickerData.name)
    private readonly compoundTechnicalTickerDataModel: Model<CompoundTechnicalTickerDataDocument>,
    @InjectModel(FundamentalTickerData.name)
    private readonly fundamentalTickerDataModel: Model<FundamentalTickerDataDocument>,
    @InjectModel(TechnicalTickerData.name)
    private readonly technicalTickerDataModel: Model<TechnicalTickerDataDocument>,
    @InjectModel(MarketHours.name)
    private readonly marketHoursModel: Model<MarketHoursDocument>,
    @InjectModel(TickerFinancialHistory.name)
    private readonly tickerFinancialHistoryModel: Model<TickerFinancialHistoryDocument>,
    @InjectModel(TickerEarningsHistory.name)
    private readonly tickerEarningsHistoryModel: Model<TickerEarningsHistoryDocument>,
    @InjectModel(SyncHistory.name)
    private readonly syncHistoryModel: Model<SyncHistoryDocument>,
    private readonly syncHistoryRepository: SyncHistoryRepository,
  ) {}

  // Ranks tickers by how closely they match the search term: exact match,
  // then prefix, then substring — this handles partial input (and typos via
  // substring, e.g. "thyssenkrup" for "thyssenkrupp") precisely. Only falls
  // back to fuzzy matching when nothing matches as a substring, since fuzzy
  // scoring alone is too noisy for short queries (e.g. "TKA" fuzzy-matching
  // hundreds of unrelated tickers).
  private rankTickerCandidates<
    T extends { ticker: string; companyName: string },
  >(candidates: T[], search: string): T[] {
    const term = search.toLowerCase();

    const scored = candidates
      .map((candidate) => {
        const ticker = candidate.ticker.toLowerCase();
        const companyName = candidate.companyName.toLowerCase();

        let score: number | null = null;
        if (ticker === term || companyName === term) {
          score = 0;
        } else if (ticker.startsWith(term) || companyName.startsWith(term)) {
          score = 1;
        } else if (ticker.includes(term) || companyName.includes(term)) {
          score = 2;
        }

        return { candidate, score };
      })
      .filter(
        (entry): entry is { candidate: T; score: number } =>
          entry.score !== null,
      );

    if (scored.length > 0) {
      return scored
        .sort(
          (a, b) =>
            a.score - b.score ||
            a.candidate.companyName.localeCompare(b.candidate.companyName),
        )
        .map((entry) => entry.candidate);
    }

    return new Fuse(candidates, {
      keys: [
        { name: 'ticker', weight: 0.6 },
        { name: 'companyName', weight: 0.4 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    })
      .search(search)
      .map((result) => result.item);
  }

  async getScreenerTickerOptions(
    userId: string,
    query: GetScreenerTickerOptionsDto,
  ): Promise<PaginatedTickerOptionDto> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const candidates = await this.tickerSourceModel.aggregate<{
      isin: string;
      ticker: string;
      companyName: string;
    }>([
      { $match: { source: user.tickerSource } },
      {
        $lookup: {
          from: 'ticker_static_data',
          localField: 'isin',
          foreignField: 'isin',
          as: 'staticData',
        },
      },
      {
        $addFields: {
          companyName: {
            $ifNull: [
              { $arrayElemAt: ['$staticData.companyName', 0] },
              '$ticker',
            ],
          },
        },
      },
      { $sort: { companyName: 1, ticker: 1 } },
      { $project: { _id: 0, isin: 1, ticker: 1, companyName: 1 } },
    ]);

    const rows = search
      ? this.rankTickerCandidates(candidates, search)
      : candidates;

    const total = rows.length;
    const skip = (page - 1) * limit;
    const data = rows
      .slice(skip, skip + limit)
      .map((row) => new TickerOptionDto(row.isin, row.ticker, row.companyName));

    return new PaginatedTickerOptionDto(
      data,
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  async getScreener(query: GetScreenerDto): Promise<PaginatedTickerDto> {
    const tickers = await this.buildScreenerTickers();

    const filters = parseScreenerFilters(query.filters);
    const filtered = applyScreenerFilters(tickers, filters);
    const sorted = sortScreenerTickers(filtered, query.sortBy, query.sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const total = sorted.length;
    const start = (page - 1) * limit;
    const data = sorted.slice(start, start + limit);

    return new PaginatedTickerDto(
      data,
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  async getTickersByList(tickers: string[]): Promise<TickerDto[]> {
    if (tickers.length === 0) {
      return [];
    }

    const wanted = new Set(tickers);
    const all = await this.buildScreenerTickers();
    return all.filter((ticker) => wanted.has(ticker.ticker));
  }

  async getScreenerFilterOptions(): Promise<ScreenerFilterOptionsDto> {
    const tickers = await this.buildScreenerTickers();

    return new ScreenerFilterOptionsDto({
      sectors: this.uniqueSorted(tickers.map((t) => t.sector)),
      industries: this.uniqueSorted(tickers.map((t) => t.industry)),
      countries: this.uniqueSorted(tickers.map((t) => t.country)),
      markets: this.uniqueSorted(tickers.map((t) => t.market)),
      currencies: this.uniqueSorted(tickers.map((t) => t.currency)),
      analystRatings: this.uniqueSorted(tickers.map((t) => t.analystRating)),
    });
  }

  private async buildScreenerTickers(): Promise<TickerDto[]> {
    await this.tickerSyncService.ensureSyncedToday({ type: SyncType.Auto });

    const [
      staticData,
      technicalData,
      fundamentalData,
      marketHours,
      hiddenIsins,
    ] = await Promise.all([
      this.tickerStaticDataModel.find().lean(),
      this.latestPerTicker<CompoundTechnicalTickerData & WithUpdatedAt>(
        this.compoundTechnicalTickerDataModel,
      ),
      this.latestPerTicker<FundamentalTickerData>(
        this.fundamentalTickerDataModel,
      ),
      this.marketHoursModel.find().lean(),
      this.tickerHealthService.getHiddenIsins(),
    ]);

    const technicalByIsin = new Map(
      technicalData.map((doc) => [doc.isin, doc]),
    );
    const fundamentalByIsin = new Map(
      fundamentalData.map((doc) => [doc.isin, doc]),
    );
    const marketLabelByCode = new Map(
      marketHours.map((doc) => [doc.market, doc.label]),
    );

    return staticData
      .filter((ticker) => !hiddenIsins.has(ticker.isin))
      .map((ticker) =>
        this.toTickerDto(
          ticker,
          technicalByIsin.get(ticker.isin),
          fundamentalByIsin.get(ticker.isin),
          (ticker.market && marketLabelByCode.get(ticker.market)) ?? null,
        ),
      );
  }

  // Same exact/prefix/substring-then-fuzzy scoring as rankTickerCandidates,
  // but matching on isin/ticker only, since that's what hidden-ticker
  // search is scoped to (company name isn't shown as a search field there).
  private rankByIsinOrTicker<T extends { isin: string; ticker: string }>(
    candidates: T[],
    search: string,
  ): T[] {
    const term = search.toLowerCase();

    const scored = candidates
      .map((candidate) => {
        const isin = candidate.isin.toLowerCase();
        const ticker = candidate.ticker.toLowerCase();

        let score: number | null = null;
        if (isin === term || ticker === term) {
          score = 0;
        } else if (isin.startsWith(term) || ticker.startsWith(term)) {
          score = 1;
        } else if (isin.includes(term) || ticker.includes(term)) {
          score = 2;
        }

        return { candidate, score };
      })
      .filter(
        (entry): entry is { candidate: T; score: number } =>
          entry.score !== null,
      );

    if (scored.length > 0) {
      return scored
        .sort(
          (a, b) =>
            a.score - b.score ||
            a.candidate.ticker.localeCompare(b.candidate.ticker),
        )
        .map((entry) => entry.candidate);
    }

    return new Fuse(candidates, {
      keys: [
        { name: 'isin', weight: 0.5 },
        { name: 'ticker', weight: 0.5 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    })
      .search(search)
      .map((result) => result.item);
  }

  async getHiddenTickers(
    query: GetHiddenTickersDto,
  ): Promise<PaginatedHiddenTickerDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const hidden = await this.tickerHealthService.listHidden();
    if (hidden.length === 0) {
      return new PaginatedHiddenTickerDto([], page, limit, 0, 1);
    }

    const isins = hidden.map((doc) => doc.isin);
    const staticData = await this.tickerStaticDataModel
      .find({ isin: { $in: isins } })
      .select('isin companyName logoUrl')
      .lean();
    const staticByIsin = new Map(staticData.map((doc) => [doc.isin, doc]));

    const rows = search ? this.rankByIsinOrTicker(hidden, search) : hidden;

    const total = rows.length;
    const skip = (page - 1) * limit;
    const data = rows.slice(skip, skip + limit).map((doc) => {
      const info = staticByIsin.get(doc.isin);
      return new HiddenTickerDto(
        doc.isin,
        doc.ticker,
        info?.companyName ?? null,
        info?.logoUrl ?? null,
        doc.errorCount,
        doc.lastError ?? null,
        doc.lastErrorAt ?? null,
        doc.hiddenAt ?? null,
      );
    });

    return new PaginatedHiddenTickerDto(
      data,
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  async unhideTicker(ticker: string): Promise<void> {
    await this.tickerHealthService.unhideByTicker(ticker);
  }

  // Every non-hidden ticker with a resolved market, annotated with whether
  // its EOD data is currently healthy (synced since its market's last
  // regular close, within TICKER_STALE_THRESHOLD_MINUTES) or not. Tickers
  // whose market hasn't been resolved yet (pending their first static sync)
  // or whose market has no configured hours are excluded — there's no close
  // to gate staleness against yet.
  private async computeTickerHealthEntries(): Promise<TickerHealthEntry[]> {
    const [staticData, hiddenIsins, marketHoursByCode, lastFullSyncedByIsin, marketLabelByCode] =
      await Promise.all([
        this.tickerStaticDataModel
          .find({ market: { $ne: null } })
          .select('isin ticker companyName logoUrl market')
          .lean(),
        this.tickerHealthService.getHiddenIsins(),
        this.marketService.getMarketHoursByCode(),
        this.tickerHealthService.getLastFullSyncedByIsin(),
        this.getMarketLabelsByCode(),
      ]);

    const thresholdMinutes = this.configService.getNumber(
      TICKER_STALE_THRESHOLD_MINUTES_ENV_VAR,
      DEFAULT_TICKER_STALE_THRESHOLD_MINUTES,
    );
    const now = new Date();

    const entries: TickerHealthEntry[] = [];
    for (const ticker of staticData) {
      if (!ticker.market || hiddenIsins.has(ticker.isin)) {
        continue;
      }
      const hours = marketHoursByCode.get(ticker.market);
      if (!hours) {
        continue;
      }

      const lastFullSyncedAt = lastFullSyncedByIsin.get(ticker.isin) ?? null;
      const minutesPastClose = minutesPastRegularClose(hours);

      let status = SyncHealthStatus.Healthy;
      let reason: SyncHealthReason | null = null;
      if (minutesPastClose != null && minutesPastClose >= thresholdMinutes) {
        if (!lastFullSyncedAt) {
          status = SyncHealthStatus.Unhealthy;
          reason = SyncHealthReason.NeverSynced;
        } else if (
          calendarDateKey(lastFullSyncedAt, hours.timezone) !==
          calendarDateKey(now, hours.timezone)
        ) {
          status = SyncHealthStatus.Unhealthy;
          reason = SyncHealthReason.StaleSinceClose;
        }
      }

      entries.push({
        isin: ticker.isin,
        ticker: ticker.ticker,
        companyName: ticker.companyName ?? null,
        logoUrl: ticker.logoUrl ?? null,
        market: ticker.market,
        marketLabel: marketLabelByCode.get(ticker.market) ?? null,
        lastFullSyncedAt,
        minutesPastClose,
        status,
        reason,
      });
    }

    return entries;
  }

  async getSyncHealthSummary(): Promise<SyncHealthSummaryDto> {
    const entries = await this.computeTickerHealthEntries();
    const unhealthyCount = entries.filter(
      (entry) => entry.status === SyncHealthStatus.Unhealthy,
    ).length;

    return new SyncHealthSummaryDto(
      entries.length,
      entries.length - unhealthyCount,
      unhealthyCount,
    );
  }

  async getSyncHealthList(
    query: GetSyncHealthDto,
  ): Promise<PaginatedTickerSyncHealthDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const entries = await this.computeTickerHealthEntries();
    const filtered = entries.filter((entry) => entry.status === query.status);
    const rows = search ? this.rankByIsinOrTicker(filtered, search) : filtered;

    // Unhealthy: most overdue first, so the worst offenders surface
    // immediately. Healthy has no meaningful staleness ordering (most are
    // simply not due yet), so it falls back to ticker alphabetical order.
    rows.sort((a, b) =>
      query.status === SyncHealthStatus.Unhealthy
        ? (b.minutesPastClose ?? -1) - (a.minutesPastClose ?? -1)
        : a.ticker.localeCompare(b.ticker),
    );

    const total = rows.length;
    const skip = (page - 1) * limit;
    const data = rows.slice(skip, skip + limit).map(
      (entry) =>
        new TickerSyncHealthDto(
          entry.isin,
          entry.ticker,
          entry.companyName,
          entry.logoUrl,
          entry.market,
          entry.marketLabel,
          entry.lastFullSyncedAt,
          entry.minutesPastClose,
          entry.status,
          entry.reason,
        ),
    );

    return new PaginatedTickerSyncHealthDto(
      data,
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  private uniqueSorted(values: (string | null | undefined)[]): string[] {
    const unique = Array.from(new Set(values.filter((v): v is string => !!v)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }

  async getTicker(ticker: string): Promise<TickerDto> {
    const [staticData, technical, fundamental] = await Promise.all([
      this.tickerStaticDataModel.findOne({ ticker }).lean(),
      this.compoundTechnicalTickerDataModel
        .findOne({ ticker })
        .sort({ syncDate: -1 })
        .lean<CompoundTechnicalTickerData & WithUpdatedAt>(),
      this.fundamentalTickerDataModel
        .findOne({ ticker })
        .sort({ syncDate: -1 })
        .lean<FundamentalTickerData>(),
    ]);

    if (!staticData) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }

    const marketHours = staticData.market
      ? await this.marketHoursModel
          .findOne({ market: staticData.market })
          .lean()
      : null;

    return this.toTickerDto(
      staticData,
      technical,
      fundamental,
      marketHours?.label ?? null,
    );
  }

  async getMarketHours(ticker: string): Promise<MarketHoursDto> {
    const staticData = await this.tickerStaticDataModel
      .findOne({ ticker })
      .lean();

    if (!staticData) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }

    const marketHours = staticData.market
      ? await this.marketHoursModel
          .findOne({ market: staticData.market })
          .lean()
      : null;

    if (!marketHours) {
      throw new NotFoundException(`Market hours for ${ticker} not found`);
    }

    return new MarketHoursDto(
      marketHours.market,
      marketHours.label,
      marketHours.timezone,
      marketHours.preMarketOpen ?? null,
      marketHours.regularOpen,
      marketHours.regularClose,
      marketHours.postMarketClose ?? null,
    );
  }

  async getSyncStatus(): Promise<SyncStatusDto> {
    const lastSync = await this.syncHistoryModel
      .findOne({
        status: { $in: [SyncStatus.Success, SyncStatus.PartialSuccess] },
      })
      .sort({ syncDate: -1 })
      .lean();

    return new SyncStatusDto(lastSync?.syncDate ?? null);
  }

  async getSyncHistoryList(
    query: GetSyncHistoryDto,
  ): Promise<PaginatedSyncHistoryDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { items, total } = await this.syncHistoryRepository.list(
      page,
      limit,
      query.status,
    );
    const [usernameById, marketLabelByCode] = await Promise.all([
      this.getUsernamesByIds(
        items
          .map((item) => item.triggeredByUserId)
          .filter((id): id is string => !!id),
      ),
      this.getMarketLabelsByCode(),
    ]);

    return new PaginatedSyncHistoryDto(
      items.map((item) =>
        this.toSyncHistoryListItemDto(item, usernameById, marketLabelByCode),
      ),
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  async getSyncHistoryDetail(id: string): Promise<SyncHistoryDetailDto> {
    const doc = await this.syncHistoryRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Sync history entry ${id} not found`);
    }

    const [usernameById, marketLabelByCode] = await Promise.all([
      this.getUsernamesByIds(
        doc.triggeredByUserId ? [doc.triggeredByUserId] : [],
      ),
      this.getMarketLabelsByCode(),
    ]);
    const base = this.toSyncHistoryListItemDto(
      doc,
      usernameById,
      marketLabelByCode,
    );

    const staticData = doc.isins.length
      ? await this.tickerStaticDataModel
          .find({ isin: { $in: doc.isins } })
          .select('isin companyName logoUrl')
          .lean()
      : [];
    const staticByIsin = new Map(staticData.map((row) => [row.isin, row]));
    const errorsByIsin = this.getTickerErrorsByIsin(doc);

    const tickers = doc.isins.map((isin) => {
      const info = staticByIsin.get(isin);
      const ticker = doc.resolvedTickers[isin] ?? null;
      return new SyncHistoryTickerDto(
        isin,
        ticker,
        info?.companyName ?? null,
        info?.logoUrl ?? null,
        this.getTickerStatus(isin, ticker, errorsByIsin),
        errorsByIsin.get(isin) ?? null,
      );
    });

    return new SyncHistoryDetailDto(base, tickers, doc.generalError ?? null);
  }

  private async getMarketLabelsByCode(): Promise<Map<string, string>> {
    const marketHours = await this.marketHoursModel.find().lean();
    return new Map(marketHours.map((doc) => [doc.market, doc.label]));
  }

  // Every raw exchange code actually present on a non-hidden ticker (what
  // sync scheduling groups chunks by, see MarketService.getMarketByIsin),
  // not just the ones with configured market_hours. A market with no
  // market_hours entry still gets synced (see MarketService.isMarketDueForSync)
  // but has a null label here so the admin UI can surface it as unconfigured
  // rather than silently dropping it, as the market_hours-derived label in
  // ScreenerFilterOptionsDto.markets does.
  async getMarketSummaries(): Promise<MarketSummaryDto[]> {
    const [staticData, hiddenIsins, marketLabelByCode, technicalData] =
      await Promise.all([
        this.tickerStaticDataModel
          .find({ market: { $ne: null } })
          .select('isin market')
          .lean(),
        this.tickerHealthService.getHiddenIsins(),
        this.getMarketLabelsByCode(),
        this.latestPerTicker<CompoundTechnicalTickerData & WithUpdatedAt>(
          this.compoundTechnicalTickerDataModel,
        ),
      ]);

    const updatedAtByIsin = new Map(
      technicalData.map((doc) => [doc.isin, doc.updatedAt]),
    );

    const isinsByMarket = new Map<string, string[]>();
    for (const ticker of staticData) {
      if (!ticker.market || hiddenIsins.has(ticker.isin)) {
        continue;
      }
      const group = isinsByMarket.get(ticker.market);
      if (group) {
        group.push(ticker.isin);
      } else {
        isinsByMarket.set(ticker.market, [ticker.isin]);
      }
    }

    return [...isinsByMarket.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([market, isins]) => {
        // Approximates "last complete sync" the same way the previous
        // frontend-side computation did: least-recent refresh across the
        // market's tickers, since we only have a per-ticker last-sync date.
        const updatedDates = isins
          .map((isin) => updatedAtByIsin.get(isin))
          .filter((date): date is Date => Boolean(date));
        const lastCompleteSync = updatedDates.length
          ? updatedDates.reduce((earliest, current) =>
              current < earliest ? current : earliest,
            )
          : null;

        return new MarketSummaryDto(
          market,
          marketLabelByCode.get(market) ?? null,
          lastCompleteSync?.toISOString() ?? null,
        );
      });
  }

  private async getUsernamesByIds(
    ids: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const users = await this.userService.findByIds(uniqueIds);
    return new Map(users.map((user) => [user._id.toString(), user.username]));
  }

  private getTickerErrorsByIsin(doc: SyncHistoryDocument): Map<string, string> {
    if (!doc.tickerErrors) {
      return new Map();
    }
    return new Map(
      Object.entries(JSON.parse(doc.tickerErrors) as Record<string, string>),
    );
  }

  // A ticker succeeded if it resolved to a Yahoo ticker and has no
  // recorded error, failed if it has a recorded error (whether that
  // happened during ISIN resolution or the sync itself), and otherwise
  // never ran at all (the chunk was aborted, e.g. by a timeout, before
  // reaching it).
  private getTickerStatus(
    isin: string,
    ticker: string | null,
    errorsByIsin: Map<string, string>,
  ): TickerSyncStatus {
    if (errorsByIsin.has(isin)) {
      return TickerSyncStatus.Failed;
    }
    return ticker ? TickerSyncStatus.Success : TickerSyncStatus.DidNotRun;
  }

  private getTickerOutcomeCounts(
    doc: SyncHistoryDocument,
  ): { succeeded: number; failed: number } {
    const errorsByIsin = this.getTickerErrorsByIsin(doc);
    let succeeded = 0;
    let failed = 0;
    for (const isin of doc.isins) {
      const status = this.getTickerStatus(
        isin,
        doc.resolvedTickers[isin] ?? null,
        errorsByIsin,
      );
      if (status === TickerSyncStatus.Success) {
        succeeded += 1;
      } else {
        failed += 1;
      }
    }
    return { succeeded, failed };
  }

  private toSyncHistoryListItemDto(
    doc: SyncHistoryDocument,
    usernameById: Map<string, string>,
    marketLabelByCode: Map<string, string>,
  ): SyncHistoryListItemDto {
    const { createdAt, updatedAt } = doc as SyncHistoryDocument &
      WithTimestamps;
    const { succeeded, failed } = this.getTickerOutcomeCounts(doc);

    return new SyncHistoryListItemDto(
      doc._id.toString(),
      doc.type,
      doc.kind,
      doc.status,
      doc.syncDate,
      doc.market,
      (doc.market && marketLabelByCode.get(doc.market)) ?? null,
      doc.tickerCount,
      succeeded,
      failed,
      doc.triggeredByUserId ?? null,
      doc.triggeredByUserId
        ? (usernameById.get(doc.triggeredByUserId) ?? null)
        : null,
      createdAt,
      doc.status === SyncStatus.Running ? null : updatedAt,
    );
  }

  async getFundamental(ticker: string): Promise<FundamentalTickerDto> {
    const fundamental = await this.fundamentalTickerDataModel
      .findOne({ ticker })
      .sort({ syncDate: -1 })
      .lean<(FundamentalTickerData & WithUpdatedAt) | null>();

    if (!fundamental) {
      throw new NotFoundException(`Fundamental data for ${ticker} not found`);
    }

    return new FundamentalTickerDto(
      ticker,
      fundamental.marketCap ?? null,
      fundamental.peRatio ?? null,
      fundamental.psRatio ?? null,
      fundamental.ebitda ?? null,
      fundamental.totalDebt ?? null,
      fundamental.totalCash ?? null,
      fundamental.debtToEquity ?? null,
      fundamental.enterpriseValue ?? null,
      fundamental.revenue ?? null,
      fundamental.grossProfit ?? null,
      fundamental.netIncome ?? null,
      fundamental.revenuePerShare ?? null,
      fundamental.forwardPE ?? null,
      fundamental.pegRatio ?? null,
      fundamental.evToEbitda ?? null,
      fundamental.evToRevenue ?? null,
      fundamental.priceToBook ?? null,
      fundamental.epsTrailing ?? null,
      fundamental.epsForward ?? null,
      fundamental.fiftyTwoWeekHigh ?? null,
      fundamental.fiftyTwoWeekLow ?? null,
      fundamental.grossMargin ?? null,
      fundamental.operatingMargin ?? null,
      fundamental.ebitdaMargin ?? null,
      fundamental.profitMargin ?? null,
      fundamental.returnOnEquity ?? null,
      fundamental.returnOnAssets ?? null,
      fundamental.revenueGrowth ?? null,
      fundamental.earningsGrowth ?? null,
      fundamental.operatingCashflow ?? null,
      fundamental.freeCashflow ?? null,
      fundamental.capex ?? null,
      fundamental.fcfMargin ?? null,
      fundamental.fcfYield ?? null,
      fundamental.netDebt ?? null,
      fundamental.netDebtToEbitda ?? null,
      fundamental.currentRatio ?? null,
      fundamental.quickRatio ?? null,
      fundamental.bookValuePerShare ?? null,
      fundamental.cashPerShare ?? null,
      fundamental.forwardDividendRate ?? null,
      fundamental.trailingDividendRate ?? null,
      fundamental.dividendYield ?? null,
      fundamental.fiveYearAvgDividendYield ?? null,
      fundamental.payoutRatio ?? null,
      fundamental.exDividendDate ?? null,
      fundamental.analystRating ?? null,
      fundamental.analystTargetMean ?? null,
      fundamental.analystTargetLow ?? null,
      fundamental.analystTargetHigh ?? null,
      fundamental.analystCount ?? null,
      fundamental.sharesOutstanding ?? null,
      fundamental.floatShares ?? null,
      fundamental.insidersPercent ?? null,
      fundamental.institutionsPercent ?? null,
      fundamental.piotroskiScore ?? null,
      fundamental.altmanZScore ?? null,
      fundamental.sma50 ?? null,
      fundamental.sma200 ?? null,
      fundamental.beta ?? null,
      fundamental.sp500Change52w ?? null,
      fundamental.avgVolume30d ?? null,
      fundamental.avgVolume10d ?? null,
      fundamental.updatedAt ?? null,
    );
  }

  async getFinancialHistory(ticker: string): Promise<FinancialHistoryDto> {
    const financialHistory = await this.tickerFinancialHistoryModel
      .findOne({ ticker })
      .lean<TickerFinancialHistory | null>();

    if (!financialHistory) {
      throw new NotFoundException(`Financial history for ${ticker} not found`);
    }

    return new FinancialHistoryDto(
      ticker,
      financialHistory.annual.map(
        (period) =>
          new AnnualFinancialPeriodDto(
            period.periodEnd,
            period.revenue ?? null,
            period.ebitda ?? null,
            period.netIncome ?? null,
            period.operatingCashflow ?? null,
            period.capex ?? null,
            period.freeCashflow ?? null,
            period.cash ?? null,
            period.totalDebt ?? null,
            period.netDebt ?? null,
          ),
      ),
    );
  }

  async getEarningsHistory(ticker: string): Promise<EarningsHistoryDto> {
    const earningsHistory = await this.tickerEarningsHistoryModel
      .findOne({ ticker })
      .lean<TickerEarningsHistory | null>();

    if (!earningsHistory) {
      throw new NotFoundException(`Earnings history for ${ticker} not found`);
    }

    return new EarningsHistoryDto(
      ticker,
      earningsHistory.eps.map(
        (period) =>
          new EpsPeriodDto(
            period.quarter,
            period.actual ?? null,
            period.estimate ?? null,
          ),
      ),
      earningsHistory.revenue.map(
        (period) => new RevenuePeriodDto(period.quarter, period.actual ?? null),
      ),
    );
  }

  // fundamental_ticker_data keeps one document per (isin, syncDate), so this
  // doubles as the Altman Z-Score's daily history; the score itself only
  // changes with annual filings and is carried forward on days it isn't
  // recomputed (see FundamentalSyncService), which is fine for a trend chart.
  async getAltmanHistory(ticker: string): Promise<AltmanHistoryDto> {
    const history = await this.fundamentalTickerDataModel
      .find({ ticker, altmanZScore: { $ne: null } })
      .sort({ syncDate: 1 })
      .select('syncDate altmanZScore')
      .lean<Pick<FundamentalTickerData, 'syncDate' | 'altmanZScore'>[]>();

    return new AltmanHistoryDto(
      ticker,
      history.map(
        (point) =>
          new AltmanScorePointDto(point.syncDate, point.altmanZScore as number),
      ),
    );
  }

  async getChart(
    ticker: string,
    window: CandleWindow,
  ): Promise<TickerChartDto> {
    const technicalTickerData = await this.technicalTickerDataModel
      .findOne({ ticker, window })
      .lean();

    if (!technicalTickerData) {
      throw new NotFoundException(
        `Chart data for ${ticker} (${window}) not found`,
      );
    }

    const candles = technicalTickerData.candles.map(
      (candle) =>
        new CandleDto(
          candle.startTime,
          candle.endTime,
          candle.entry,
          candle.exit,
          candle.low,
          candle.high,
          candle.volume,
        ),
    );

    return new TickerChartDto(ticker, window, candles);
  }

  private toTickerDto(
    staticData: TickerStaticData,
    technical: (CompoundTechnicalTickerData & WithUpdatedAt) | null | undefined,
    fundamental: FundamentalTickerData | null | undefined,
    marketLabel: string | null,
  ): TickerDto {
    return new TickerDto({
      isin: staticData.isin,
      ticker: staticData.ticker,
      companyName: staticData.companyName,
      sector: staticData.sector ?? null,
      industry: staticData.industry ?? null,
      marketCap: fundamental?.marketCap ?? null,
      peRatio: fundamental?.peRatio ?? null,
      price: technical?.price ?? null,
      country: staticData.country ?? null,
      description: staticData.description ?? null,
      market: marketLabel,
      currency: staticData.currency ?? null,
      changePercent: technical?.changePercent1d ?? null,
      changePercent5d: technical?.changePercent5d ?? null,
      changePercent1w: technical?.changePercent1w ?? null,
      changePercent1m: technical?.changePercent1m ?? null,
      changePercent3m: technical?.changePercent3m ?? null,
      changePercent6m: technical?.changePercent6m ?? null,
      changePercentYtd: technical?.changePercentYtd ?? null,
      changePercent1y: technical?.changePercent1y ?? null,
      employees: staticData.employees ?? null,
      fiscalYearEnd: staticData.fiscalYearEnd ?? null,
      mostRecentQuarter: staticData.mostRecentQuarter ?? null,
      rsi14: technical?.rsi14 ?? null,
      macd: technical?.macd ?? null,
      macdSignal: technical?.macdSignal ?? null,
      macdHistogram: technical?.macdHistogram ?? null,
      bbUpper: technical?.bbUpper ?? null,
      bbMiddle: technical?.bbMiddle ?? null,
      bbLower: technical?.bbLower ?? null,
      bbWidth: technical?.bbWidth ?? null,
      atr14: technical?.atr14 ?? null,
      volumeRatio20d: technical?.volumeRatio20d ?? null,
      refreshedAt: technical?.updatedAt ?? null,
      website: staticData.website ?? null,
      logoUrl: staticData.logoUrl ?? null,
      psRatio: fundamental?.psRatio ?? null,
      forwardPE: fundamental?.forwardPE ?? null,
      pegRatio: fundamental?.pegRatio ?? null,
      evToEbitda: fundamental?.evToEbitda ?? null,
      evToRevenue: fundamental?.evToRevenue ?? null,
      priceToBook: fundamental?.priceToBook ?? null,
      epsTrailing: fundamental?.epsTrailing ?? null,
      epsForward: fundamental?.epsForward ?? null,
      enterpriseValue: fundamental?.enterpriseValue ?? null,
      fiftyTwoWeekHigh: fundamental?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: fundamental?.fiftyTwoWeekLow ?? null,
      revenue: fundamental?.revenue ?? null,
      grossProfit: fundamental?.grossProfit ?? null,
      netIncome: fundamental?.netIncome ?? null,
      revenuePerShare: fundamental?.revenuePerShare ?? null,
      ebitda: fundamental?.ebitda ?? null,
      grossMargin: fundamental?.grossMargin ?? null,
      operatingMargin: fundamental?.operatingMargin ?? null,
      ebitdaMargin: fundamental?.ebitdaMargin ?? null,
      profitMargin: fundamental?.profitMargin ?? null,
      returnOnEquity: fundamental?.returnOnEquity ?? null,
      returnOnAssets: fundamental?.returnOnAssets ?? null,
      revenueGrowth: fundamental?.revenueGrowth ?? null,
      operatingCashflow: fundamental?.operatingCashflow ?? null,
      freeCashflow: fundamental?.freeCashflow ?? null,
      capex: fundamental?.capex ?? null,
      totalDebt: fundamental?.totalDebt ?? null,
      totalCash: fundamental?.totalCash ?? null,
      debtToEquity: fundamental?.debtToEquity ?? null,
      currentRatio: fundamental?.currentRatio ?? null,
      quickRatio: fundamental?.quickRatio ?? null,
      bookValuePerShare: fundamental?.bookValuePerShare ?? null,
      dividendYield: fundamental?.dividendYield ?? null,
      payoutRatio: fundamental?.payoutRatio ?? null,
      fiveYearAvgDividendYield: fundamental?.fiveYearAvgDividendYield ?? null,
      exDividendDate: fundamental?.exDividendDate ?? null,
      analystRating: fundamental?.analystRating ?? null,
      analystTargetMean: fundamental?.analystTargetMean ?? null,
      analystTargetLow: fundamental?.analystTargetLow ?? null,
      analystTargetHigh: fundamental?.analystTargetHigh ?? null,
      analystCount: fundamental?.analystCount ?? null,
      sharesOutstanding: fundamental?.sharesOutstanding ?? null,
      floatShares: fundamental?.floatShares ?? null,
      insidersPercent: fundamental?.insidersPercent ?? null,
      institutionsPercent: fundamental?.institutionsPercent ?? null,
      piotroskiScore: fundamental?.piotroskiScore ?? null,
      altmanZScore: fundamental?.altmanZScore ?? null,
      sma50: fundamental?.sma50 ?? null,
      sma200: fundamental?.sma200 ?? null,
      beta: fundamental?.beta ?? null,
      avgVolume10d: fundamental?.avgVolume10d ?? null,
    });
  }

  private latestPerTicker<T extends { isin: string; syncDate: Date }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: Model<any>,
  ): Promise<T[]> {
    return model.aggregate<T>([
      { $sort: { syncDate: -1 } },
      { $group: { _id: '$isin', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
  }
}
