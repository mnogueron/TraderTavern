import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { TickerHealthService } from './ticker-health.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { SharedModule } from '../shared/shared.module';
import { TickerSourceModule } from '../ticker-source/ticker-source.module';
import { TickerSource, TickerSourceSchema } from '../ticker-source/schemas/ticker-source.schema';
import { TickerStaticData, TickerStaticDataSchema } from './schemas/ticker-static-data.schema';
import {
  CompoundTechnicalTickerData,
  CompoundTechnicalTickerDataSchema,
} from './schemas/compound-technical-ticker-data.schema';
import {
  FundamentalTickerData,
  FundamentalTickerDataSchema,
} from './schemas/fundamental-ticker-data.schema';
import { SyncHistory, SyncHistorySchema } from './schemas/sync-history.schema';
import {
  TechnicalTickerData,
  TechnicalTickerDataSchema,
} from './schemas/technical-ticker-data.schema';
import { MarketHours, MarketHoursSchema } from './schemas/market-hours.schema';
import {
  TickerFinancialHistory,
  TickerFinancialHistorySchema,
} from './schemas/ticker-financial-history.schema';
import {
  TickerEarningsHistory,
  TickerEarningsHistorySchema,
} from './schemas/ticker-earnings-history.schema';
import {
  TickerSyncHealth,
  TickerSyncHealthSchema,
} from './schemas/ticker-sync-health.schema';
import { TickerStaticDataRepository } from './repositories/ticker-static-data.repository';
import { CompoundTechnicalDataRepository } from './repositories/compound-technical-data.repository';
import { FundamentalDataRepository } from './repositories/fundamental-data.repository';
import { TechnicalDataRepository } from './repositories/technical-data.repository';
import { FinancialHistoryRepository } from './repositories/financial-history.repository';
import { EarningsHistoryRepository } from './repositories/earnings-history.repository';
import { MarketHoursRepository } from './repositories/market-hours.repository';
import { SyncHistoryRepository } from './repositories/sync-history.repository';

@Module({
  imports: [
    AuthModule,
    UserModule,
    SharedModule,
    TickerSourceModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: TickerStaticData.name, schema: TickerStaticDataSchema },
      {
        name: CompoundTechnicalTickerData.name,
        schema: CompoundTechnicalTickerDataSchema,
      },
      { name: FundamentalTickerData.name, schema: FundamentalTickerDataSchema },
      { name: SyncHistory.name, schema: SyncHistorySchema },
      { name: TechnicalTickerData.name, schema: TechnicalTickerDataSchema },
      { name: MarketHours.name, schema: MarketHoursSchema },
      {
        name: TickerFinancialHistory.name,
        schema: TickerFinancialHistorySchema,
      },
      {
        name: TickerEarningsHistory.name,
        schema: TickerEarningsHistorySchema,
      },
      { name: TickerSource.name, schema: TickerSourceSchema },
      { name: TickerSyncHealth.name, schema: TickerSyncHealthSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    TickerSyncService,
    TickerHealthService,
    TickerStaticDataRepository,
    CompoundTechnicalDataRepository,
    FundamentalDataRepository,
    TechnicalDataRepository,
    FinancialHistoryRepository,
    EarningsHistoryRepository,
    MarketHoursRepository,
    SyncHistoryRepository,
  ],
})
export class FinanceModule {}
