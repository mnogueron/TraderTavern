import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { TickerSyncService } from './ticker-sync.service';
import { TickerDto } from './dto/Ticker.dto';
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

  @Post('sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncScreener(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.tickerSyncService.syncAll({
      type: SyncType.Manual,
      userId: user.sub,
    });
  }
}
