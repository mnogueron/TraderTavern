import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import YahooFinance from 'yahoo-finance2';
import { TickerSource, TickerSourceDocument } from './schemas/ticker-source.schema';
import { TickerSourceType } from './enums/ticker-source-type.enum';
import { TickerSourceSyncStatusDto } from './dto/TickerSourceSyncStatus.dto';
import { XTB_OMI_PDF_URL_ENV_VAR } from './constants/xtb-omi';
import { parseXtbOmiTables } from './xtb-omi.parser';
import { SCREENER_TICKERS } from '../finance/constants/tickers';

const yahooFinance = new YahooFinance();

// Raw (unvalidated) shape of a Yahoo search "quote" result. Yahoo sometimes
// includes an `isin` field for non-US listings even though it isn't part of
// yahoo-finance2's typed schema, so we read the unvalidated response instead
// of the library's typed one.
type RawYahooSearchQuote = {
  symbol?: string;
  isin?: string;
  currency?: string;
};

@Injectable()
export class TickerSourceService {
  private readonly logger = new Logger(TickerSourceService.name);
  private readonly syncsInProgress = new Set<TickerSourceType>();

  constructor(
    @InjectModel(TickerSource.name)
    private readonly tickerSourceModel: Model<TickerSourceDocument>,
    private readonly configService: ConfigService,
  ) {}

  isSyncing(source: TickerSourceType): boolean {
    return this.syncsInProgress.has(source);
  }

  async getSyncStatus(source: TickerSourceType): Promise<TickerSourceSyncStatusDto> {
    const [aggregate] = await this.tickerSourceModel.aggregate<{
      lastSyncedAt: Date;
      sourceUpdatedAt: Date | null;
      tickerCount: number;
    }>([
      { $match: { source } },
      {
        $group: {
          _id: null,
          lastSyncedAt: { $max: '$lastSyncedAt' },
          sourceUpdatedAt: { $max: '$sourceUpdatedAt' },
          tickerCount: { $sum: 1 },
        },
      },
    ]);

    return new TickerSourceSyncStatusDto(
      source,
      aggregate?.lastSyncedAt ?? null,
      aggregate?.sourceUpdatedAt ?? null,
      aggregate?.tickerCount ?? 0,
      this.isSyncing(source),
    );
  }

  async findTickerByIsin(
    isin: string,
    source: TickerSourceType,
  ): Promise<TickerSource | null> {
    return this.tickerSourceModel.findOne({ isin, source }).lean();
  }

  // Runs `sync` for `source`, guarding against overlapping runs of the same
  // source (this is an in-process lock only, which is fine here since these
  // are rare, admin-triggered operations rather than a scheduled fleet).
  private async runGuarded(
    source: TickerSourceType,
    sync: () => Promise<number>,
  ): Promise<void> {
    if (this.syncsInProgress.has(source)) {
      throw new BadRequestException(`A ${source} ticker sync is already running`);
    }

    this.syncsInProgress.add(source);
    try {
      const count = await sync();
      this.logger.log(`Synced ${count} ${source} ticker(s)`);
    } finally {
      this.syncsInProgress.delete(source);
    }
  }

  private async upsertTicker(
    row: {
      isin: string;
      ticker: string;
      name?: string;
      currency?: string;
    },
    source: TickerSourceType,
    syncedAt: Date,
    sourceUpdatedAt?: Date,
  ): Promise<void> {
    await this.tickerSourceModel.updateOne(
      { isin: row.isin, source },
      {
        $set: {
          isin: row.isin,
          source,
          ticker: row.ticker,
          name: row.name,
          currency: row.currency,
          lastSyncedAt: syncedAt,
          sourceUpdatedAt,
        },
      },
      { upsert: true },
    );
  }

  // Best-effort ISIN lookup for a Yahoo ticker symbol. Yahoo's search index
  // only carries an ISIN for a subset of (mostly non-US) listings, so this
  // can legitimately come back empty; callers must treat that as "not
  // resolvable from Yahoo" rather than an error.
  private async resolveYahooIsin(ticker: string): Promise<{
    isin?: string;
    currency?: string;
  }> {
    const result = (await yahooFinance.search(
      ticker,
      { quotesCount: 5 },
      { validateResult: false },
    )) as { quotes?: RawYahooSearchQuote[] };

    const match = (result.quotes ?? []).find((quote) => quote.symbol === ticker);
    return { isin: match?.isin, currency: match?.currency };
  }

  async syncYahoo(): Promise<void> {
    await this.runGuarded(TickerSourceType.Yahoo, async () => {
      const syncedAt = new Date();
      let successCount = 0;
      let unresolvedCount = 0;

      for (const ticker of SCREENER_TICKERS) {
        try {
          const { isin, currency } = await this.resolveYahooIsin(ticker);
          if (!isin) {
            unresolvedCount += 1;
            continue;
          }

          await this.upsertTicker(
            { isin, ticker, currency },
            TickerSourceType.Yahoo,
            syncedAt,
          );
          successCount += 1;
        } catch (error) {
          this.logger.warn(`Failed to resolve ISIN for ${ticker} via Yahoo: ${error}`);
        }
      }

      if (unresolvedCount > 0) {
        this.logger.warn(
          `${unresolvedCount} of ${SCREENER_TICKERS.length} Yahoo ticker(s) had no ISIN available and were skipped`,
        );
      }

      return successCount;
    });
  }

  private getXtbOmiPdfUrl(): string {
    const url = this.configService.get<string>(XTB_OMI_PDF_URL_ENV_VAR);
    if (!url) {
      throw new BadRequestException(
        `${XTB_OMI_PDF_URL_ENV_VAR} is not configured; set it to XTB's current quarterly OMI specification table PDF URL`,
      );
    }
    return url;
  }

  async syncXtb(): Promise<void> {
    await this.runGuarded(TickerSourceType.Xtb, async () => {
      const url = this.getXtbOmiPdfUrl();
      const syncedAt = new Date();

      const parser = new PDFParse({ url });
      let rows;
      let sourceUpdatedAt: Date | undefined;
      try {
        const [tableResult, infoResult] = await Promise.all([
          parser.getTable(),
          parser.getInfo(),
        ]);
        const tables = tableResult.pages.flatMap((page) => page.tables);
        rows = parseXtbOmiTables(tables);

        // Best-effort: use the PDF's own creation/modification date as the
        // vintage of this quarter's OMI table, falling back to the sync
        // time if the document carries no usable metadata date.
        const rawDate = infoResult.info?.ModDate ?? infoResult.info?.CreationDate;
        const parsedDate = rawDate ? new Date(rawDate) : undefined;
        sourceUpdatedAt =
          parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined;
      } finally {
        await parser.destroy();
      }

      if (rows.length === 0) {
        throw new BadRequestException(
          'No instrument rows found in the XTB OMI PDF; the document layout may have changed',
        );
      }

      for (const row of rows) {
        await this.upsertTicker(row, TickerSourceType.Xtb, syncedAt, sourceUpdatedAt);
      }

      return rows.length;
    });
  }
}
