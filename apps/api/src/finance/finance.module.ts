import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { AuthModule } from '../auth/auth.module';
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

@Module({
  imports: [
    AuthModule,
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
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, TickerSyncService],
})
export class FinanceModule {}
