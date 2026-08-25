import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { TickerDto } from './dto/Ticker.dto';
import { FundamentalTickerDto } from './dto/FundamentalTicker.dto';
import { FinancialHistoryDto } from './dto/FinancialHistory.dto';
import { EarningsHistoryDto } from './dto/EarningsHistory.dto';
import { TickerChartDto } from './dto/TickerChart.dto';
import { GetTickerChartDto } from './dto/GetTickerChart.dto';
import { GetScreenerDto } from './dto/GetScreener.dto';
import { PaginatedTickerDto } from './dto/PaginatedTicker.dto';
import { ScreenerFilterOptionsDto } from './dto/ScreenerFilterOptions.dto';
import { MarketHoursDto } from './dto/MarketHours.dto';
import { SyncStatusDto } from './dto/SyncStatus.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { Role } from '../shared/role.enum';
import { SyncType } from './enums/sync-type.enum';
import { UserService } from '../user/user.service';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly tickerSyncService: TickerSyncService,
    private readonly userService: UserService,
  ) {}

  private async resolveTickerSource(userId: string): Promise<string> {
    const user = await this.userService.findById(userId);
    return user?.tickerSource ?? 'yahoo-finance';
  }

  @Get('screener')
  @Auth()
  @ApiOkResponse({ type: PaginatedTickerDto })
  async getScreener(
    @Query() query: GetScreenerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedTickerDto> {
    const tickerSource = await this.resolveTickerSource(user.sub);
    return this.financeService.getScreener(query, user.sub, tickerSource);
  }

  @Get('screener/filters/options')
  @Auth()
  @ApiOkResponse({ type: ScreenerFilterOptionsDto })
  async getScreenerFilterOptions(
    @CurrentUser() user: JwtPayload,
  ): Promise<ScreenerFilterOptionsDto> {
    const tickerSource = await this.resolveTickerSource(user.sub);
    return this.financeService.getScreenerFilterOptions(
      user.sub,
      tickerSource,
    );
  }

  @Get('sync/status')
  @Auth()
  @ApiOkResponse({ type: SyncStatusDto })
  getSyncStatus(): Promise<SyncStatusDto> {
    return this.financeService.getSyncStatus();
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

  @Post('sync/static')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncStatic(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAllStatic({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('sync/fundamental')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncFundamental(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAllFundamental({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('sync/compound')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncCompound(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAllCompound({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('sync/technical')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncTechnical(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAllTechnical({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('ticker/:id/sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTicker(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTicker(id.toUpperCase());
  }

  @Post('ticker/:id/sync/static')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerStatic(@Param('id') id: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerStatic(id.toUpperCase());
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

  @Get('ticker/:id/financial-history')
  @Auth()
  @ApiOkResponse({ type: FinancialHistoryDto })
  getTickerFinancialHistory(
    @Param('id') id: string,
  ): Promise<FinancialHistoryDto> {
    return this.financeService.getFinancialHistory(id.toUpperCase());
  }

  @Get('ticker/:id/earnings-history')
  @Auth()
  @ApiOkResponse({ type: EarningsHistoryDto })
  getTickerEarningsHistory(
    @Param('id') id: string,
  ): Promise<EarningsHistoryDto> {
    return this.financeService.getEarningsHistory(id.toUpperCase());
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
