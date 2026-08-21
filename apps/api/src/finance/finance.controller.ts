import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { TickerDto } from './dto/Ticker.dto';
import { FundamentalTickerDto } from './dto/FundamentalTicker.dto';
import { TickerChartDto } from './dto/TickerChart.dto';
import { GetTickerChartDto } from './dto/GetTickerChart.dto';
import { MarketHoursDto } from './dto/MarketHours.dto';
import { TickerOptionDto } from './dto/TickerOption.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { Role } from '../shared/role.enum';
import { SyncType } from './enums/sync-type.enum';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly tickerSyncService: TickerSyncService,
  ) {}

  @Get('screener')
  @Auth()
  @ApiOkResponse({ type: TickerDto, isArray: true })
  getScreener(): Promise<TickerDto[]> {
    return this.financeService.getScreener();
  }

  @Get('screener/filters/tickers')
  @Auth()
  @ApiOkResponse({ type: TickerOptionDto, isArray: true })
  getScreenerTickerOptions(): Promise<TickerOptionDto[]> {
    return this.financeService.getScreenerTickerOptions();
  }

  @Post('sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncScreener(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAll({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('sync/fundamental')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncFundamental(): Promise<void> {
    return this.tickerSyncService.syncAllFundamental();
  }

  @Post('sync/compound')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncCompound(): Promise<void> {
    return this.tickerSyncService.syncAllCompound();
  }

  @Post('sync/technical')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncTechnical(): Promise<void> {
    return this.tickerSyncService.syncAllTechnical();
  }

  @Post('ticker/:id/sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTicker(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTicker(id.toUpperCase());
  }

  @Post('ticker/:id/sync/fundamental')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerFundamental(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerFundamental(id.toUpperCase());
  }

  @Post('ticker/:id/sync/compound')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerCompound(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerCompound(id.toUpperCase());
  }

  @Post('ticker/:id/sync/technical')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerTechnical(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerTechnical(id.toUpperCase());
  }

  @Get('ticker/:id')
  @Auth()
  @ApiOkResponse({ type: TickerDto })
  getTicker(@Param('id') id: string): Promise<TickerDto> {
    return this.financeService.getTicker(id.toUpperCase());
  }

  @Get('ticker/:id/fundamental')
  @Auth()
  @ApiOkResponse({ type: FundamentalTickerDto })
  getTickerFundamental(@Param('id') id: string): Promise<FundamentalTickerDto> {
    return this.financeService.getFundamental(id.toUpperCase());
  }

  @Get('ticker/:id/chart')
  @Auth()
  @ApiOkResponse({ type: TickerChartDto })
  getTickerChart(
    @Param('id') id: string,
    @Query() query: GetTickerChartDto,
  ): Promise<TickerChartDto> {
    return this.financeService.getChart(id.toUpperCase(), query.window);
  }

  @Get('ticker/:id/market-hours')
  @Auth()
  @ApiOkResponse({ type: MarketHoursDto })
  getTickerMarketHours(@Param('id') id: string): Promise<MarketHoursDto> {
    return this.financeService.getMarketHours(id.toUpperCase());
  }
}
