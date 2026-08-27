import { Module } from '@nestjs/common';
import { YahooRateLimiterService } from './yahoo-rate-limiter.service';

@Module({
  providers: [YahooRateLimiterService],
  exports: [YahooRateLimiterService],
})
export class SharedModule {}
