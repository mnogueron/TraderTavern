import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
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
import { TickerBind, TickerBindSchema } from './schemas/ticker-bind.schema';

const tickerBindFeature = MongooseModule.forFeature([
  { name: TickerBind.name, schema: TickerBindSchema },
]);

const tickerStaticDataFeature = MongooseModule.forFeature([
  { name: TickerStaticData.name, schema: TickerStaticDataSchema },
]);

@Module({
  imports: [
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
    tickerStaticDataFeature,
    MongooseModule.forFeature([
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
    ]),
    tickerBindFeature,
  ],
  controllers: [FinanceController],
  providers: [FinanceService, TickerSyncService],
  exports: [tickerBindFeature, tickerStaticDataFeature],
})
export class FinanceModule {}
