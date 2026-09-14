import { Injectable } from '@nestjs/common';
import { TickerStaticDataRepository } from './repositories/ticker-static-data.repository';
import { QuoteSummaryResult } from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';

// Computes and persists ticker_static_data: company profile fields (name,
// sector, industry, description, market, logo, ...) derived from a ticker's
// quote summary.
@Injectable()
export class StaticSyncService {
  constructor(
    private readonly tickerStaticDataRepository: TickerStaticDataRepository,
  ) {}

  async update(
    ref: TickerRef,
    quoteSummary: QuoteSummaryResult,
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
}
