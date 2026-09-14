import { Injectable } from '@nestjs/common';
import { FinancialHistoryRepository } from './repositories/financial-history.repository';
import { TickerRef } from './helpers/sync-utils';
import { AnnualFinancialPeriodDraft } from './helpers/financial-helpers';

@Injectable()
export class FinancialHistorySyncService {
  constructor(
    private readonly financialHistoryRepository: FinancialHistoryRepository,
  ) {}

  async update(
    ref: TickerRef,
    periods: AnnualFinancialPeriodDraft[],
  ): Promise<void> {
    await this.financialHistoryRepository.upsertAnnual(ref, periods);
  }
}
