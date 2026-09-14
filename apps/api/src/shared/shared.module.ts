import { Module } from '@nestjs/common';
import { YahooRateLimiterService } from './yahoo-rate-limiter.service';
import { AppConfigService } from './app-config.service';

@Module({
  providers: [YahooRateLimiterService, AppConfigService],
  exports: [YahooRateLimiterService, AppConfigService],
})
export class SharedModule {}
