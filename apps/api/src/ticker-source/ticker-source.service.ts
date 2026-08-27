import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import YahooFinance from 'yahoo-finance2';
import { TickerSource, TickerSourceDocument } from './schemas/ticker-source.schema';
import { TickerSourceType } from './enums/ticker-source-type.enum';
import { TickerSourceSyncStatusDto } from './dto/TickerSourceSyncStatus.dto';
import { parseXtbOmiText } from './xtb-omi.parser';
import { SCREENER_TICKERS } from '../finance/constants/tickers';

const yahooFinance = new YahooFinance();

// PDF metadata dates use the format `D:YYYYMMDDHHmmSS+HH'mm'` (ISO 32000
// §7.9.4), which `Date` cannot parse directly.
const PDF_DATE_PATTERN =
  /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:([+-]\d{2})'?(\d{2})'?)?/;

const parsePdfDate = (value: string | undefined): Date | undefined => {
  const match = value ? PDF_DATE_PATTERN.exec(value) : null;
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute, second, tzHour, tzMinute] = match;
  const offset = tzHour && tzMinute ? `${tzHour}:${tzMinute}` : 'Z';
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

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

  // Union of ISINs tracked under any of the given sources, e.g. every source
  // any user currently has selected as their preferred ticker source.
  async getIsinsForSources(sources: TickerSourceType[]): Promise<string[]> {
    if (sources.length === 0) {
      return [];
    }
    return this.tickerSourceModel.distinct('isin', { source: { $in: sources } });
  }

  async isKnownYahooTicker(ticker: string): Promise<boolean> {
    return this.tickerSourceModel.exists({
      ticker,
      source: TickerSourceType.Yahoo,
    }) != null;
  }

  // Resolves an ISIN to its Yahoo Finance ticker symbol, since tickers from
  // other sources (e.g. XTB) aren't the same string Yahoo expects. Results
  // are cached in ticker_sources (source=yahoo) so this only costs a Yahoo
  // request the first time a given ISIN is needed; a miss (no Yahoo listing
  // resolvable for this ISIN) is not cached, so it's retried on a later sync.
  async resolveYahooTicker(isin: string): Promise<string | undefined> {
    const existing = await this.tickerSourceModel
      .findOne({ isin, source: TickerSourceType.Yahoo })
      .lean();
    if (existing) {
      return existing.ticker;
    }

    const result = (await yahooFinance.search(
      isin,
      { quotesCount: 5 },
      { validateResult: false },
    )) as { quotes?: RawYahooSearchQuote[] };

    const match = (result.quotes ?? []).find(
      (quote) => quote.isin === isin && quote.symbol,
    );
    if (!match?.symbol) {
      return undefined;
    }

    await this.upsertTicker(
      { isin, ticker: match.symbol, currency: match.currency },
      TickerSourceType.Yahoo,
      new Date(),
    );
    return match.symbol;
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

  // Processes a manually uploaded copy of XTB's quarterly "Specification
  // Table Organised Market Instruments (OMI)" PDF. XTB doesn't publish this
  // under a stable/predictable URL, so unlike Yahoo this source is synced
  // from an admin-provided file rather than fetched automatically.
  async syncXtbFromBuffer(buffer: Buffer): Promise<void> {
    await this.runGuarded(TickerSourceType.Xtb, async () => {
      const syncedAt = new Date();

      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      let rows;
      let sourceUpdatedAt: Date | undefined;
      try {
        // pdf-parse's worker messaging can't handle concurrent calls on the
        // same instance, so these must run sequentially rather than via
        // Promise.all.
        const textResult = await parser.getText();
        const infoResult = await parser.getInfo();
        const text = textResult.pages.map((page) => page.text).join('\n');
        rows = parseXtbOmiText(text);

        // Best-effort: use the PDF's own creation/modification date as the
        // vintage of this quarter's OMI table, falling back to the sync
        // time if the document carries no usable metadata date.
        sourceUpdatedAt = parsePdfDate(infoResult.info?.ModDate ?? infoResult.info?.CreationDate);
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
