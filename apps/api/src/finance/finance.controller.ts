import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { SyncHistoryDetailDto } from './dto/SyncHistoryDetail.dto';
import { PaginatedSyncHistoryDto } from './dto/PaginatedSyncHistory.dto';
import { GetSyncHistoryDto } from './dto/GetSyncHistory.dto';
import { TickerSyncService } from './ticker-sync.service';
import { TickerDto } from './dto/Ticker.dto';
import { FundamentalTickerDto } from './dto/FundamentalTicker.dto';
import { FinancialHistoryDto } from './dto/FinancialHistory.dto';
import { EarningsHistoryDto } from './dto/EarningsHistory.dto';
import { AltmanHistoryDto } from './dto/AltmanHistory.dto';
import { TickerChartDto } from './dto/TickerChart.dto';
import { GetTickerChartDto } from './dto/GetTickerChart.dto';
import { GetScreenerDto } from './dto/GetScreener.dto';
import { GetTickersDto } from './dto/GetTickers.dto';
import { GetScreenerTickerOptionsDto } from './dto/GetScreenerTickerOptions.dto';
import { PaginatedTickerDto } from './dto/PaginatedTicker.dto';
import { PaginatedTickerOptionDto } from './dto/PaginatedTickerOption.dto';
import { ScreenerFilterOptionsDto } from './dto/ScreenerFilterOptions.dto';
import { MarketHoursDto } from './dto/MarketHours.dto';
import { MarketSummaryDto } from './dto/MarketSummary.dto';
import { SyncStatusDto } from './dto/SyncStatus.dto';
import { GetHiddenTickersDto } from './dto/GetHiddenTickers.dto';
import { PaginatedHiddenTickerDto } from './dto/PaginatedHiddenTicker.dto';
import { GetSyncHealthDto } from './dto/GetSyncHealth.dto';
import { PaginatedTickerSyncHealthDto } from './dto/PaginatedTickerSyncHealth.dto';
import { SyncHealthSummaryDto } from './dto/SyncHealthSummary.dto';
import { TriggerSyncDto } from './dto/TriggerSync.dto';
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
  @ApiOkResponse({ type: PaginatedTickerDto })
  getScreener(@Query() query: GetScreenerDto): Promise<PaginatedTickerDto> {
    return this.financeService.getScreener(query);
  }

  @Get('tickers')
  @Auth()
  @ApiOkResponse({ type: TickerDto, isArray: true })
  getTickers(@Query() query: GetTickersDto): Promise<TickerDto[]> {
    const tickers = query.tickers
      .split(',')
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean);
    return this.financeService.getTickersByList(tickers);
  }

  @Get('screener/filters/options')
  @Auth()
  @ApiOkResponse({ type: ScreenerFilterOptionsDto })
  getScreenerFilterOptions(): Promise<ScreenerFilterOptionsDto> {
    return this.financeService.getScreenerFilterOptions();
  }

  @Get('markets')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: MarketSummaryDto, isArray: true })
  getMarkets(): Promise<MarketSummaryDto[]> {
    return this.financeService.getMarketSummaries();
  }

  @Get('screener/filters/tickers')
  @Auth()
  @ApiOkResponse({ type: PaginatedTickerOptionDto })
  getScreenerTickerOptions(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetScreenerTickerOptionsDto,
  ): Promise<PaginatedTickerOptionDto> {
    return this.financeService.getScreenerTickerOptions(user.sub, query);
  }

  @Get('sync/status')
  @Auth()
  @ApiOkResponse({ type: SyncStatusDto })
  getSyncStatus(): Promise<SyncStatusDto> {
    return this.financeService.getSyncStatus();
  }

  @Get('sync/history')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: PaginatedSyncHistoryDto })
  getSyncHistoryList(
    @Query() query: GetSyncHistoryDto,
  ): Promise<PaginatedSyncHistoryDto> {
    return this.financeService.getSyncHistoryList(query);
  }

  @Get('sync/history/:id')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: SyncHistoryDetailDto })
  getSyncHistoryDetail(@Param('id') id: string): Promise<SyncHistoryDetailDto> {
    return this.financeService.getSyncHistoryDetail(id);
  }

  @Post('sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncScreener(
    @CurrentUser() user: JwtPayload,
    @Query() query: TriggerSyncDto,
  ): Promise<void> {
    const markets = query.markets
      ?.split(',')
      .map((market) => market.trim())
      .filter(Boolean);
    return this.tickerSyncService.syncAll(
      { type: SyncType.Manual, userId: user.sub },
      markets?.length ? markets : undefined,
    );
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

  @Post('ticker/:isin/sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTicker(
    @Param('isin') isin: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.tickerSyncService.syncSingleTicker(isin.toUpperCase(), {
      type: SyncType.Manual,
      userId: user.sub,
    });
  }

  @Post('ticker/:isin/sync/static')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerStatic(@Param('isin') isin: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerStatic(isin.toUpperCase());
  }

  @Post('ticker/:isin/sync/fundamental')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerFundamental(@Param('isin') isin: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerFundamental(
      isin.toUpperCase(),
    );
  }

  @Post('ticker/:isin/sync/compound')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerCompound(@Param('isin') isin: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerCompound(
      isin.toUpperCase(),
    );
  }

  @Post('ticker/:isin/sync/technical')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncSingleTickerTechnical(@Param('isin') isin: string): Promise<void> {
    return this.tickerSyncService.syncSingleTickerTechnical(
      isin.toUpperCase(),
    );
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

  @Get('ticker/:id/altman-history')
  @Auth()
  @ApiOkResponse({ type: AltmanHistoryDto })
  getTickerAltmanHistory(@Param('id') id: string): Promise<AltmanHistoryDto> {
    return this.financeService.getAltmanHistory(id.toUpperCase());
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

  @Get('tickers/hidden')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: PaginatedHiddenTickerDto })
  getHiddenTickers(
    @Query() query: GetHiddenTickersDto,
  ): Promise<PaginatedHiddenTickerDto> {
    return this.financeService.getHiddenTickers(query);
  }

  @Post('ticker/:id/unhide')
  @HttpCode(204)
  @Auth(Role.Admin)
  unhideTicker(@Param('id') id: string): Promise<void> {
    return this.financeService.unhideTicker(id.toUpperCase());
  }

  @Get('tickers/health/summary')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: SyncHealthSummaryDto })
  getSyncHealthSummary(): Promise<SyncHealthSummaryDto> {
    return this.financeService.getSyncHealthSummary();
  }

  @Get('tickers/health')
  @Auth(Role.Admin)
  @ApiOkResponse({ type: PaginatedTickerSyncHealthDto })
  getSyncHealthList(
    @Query() query: GetSyncHealthDto,
  ): Promise<PaginatedTickerSyncHealthDto> {
    return this.financeService.getSyncHealthList(query);
  }
}
