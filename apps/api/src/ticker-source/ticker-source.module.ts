import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TickerSourceController } from './ticker-source.controller';
import { TickerSourceService } from './ticker-source.service';
import { TickerSource, TickerSourceSchema } from './schemas/ticker-source.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TickerSource.name, schema: TickerSourceSchema },
    ]),
  ],
  controllers: [TickerSourceController],
  providers: [TickerSourceService],
  exports: [TickerSourceService],
})
export class TickerSourceModule {}
