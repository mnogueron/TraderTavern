import { Controller, Get, HttpCode, Param, ParseEnumPipe, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { TickerSourceService } from './ticker-source.service';
import { TickerSourceSyncStatusDto } from './dto/TickerSourceSyncStatus.dto';
import { TickerSourceType } from './enums/ticker-source-type.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../shared/role.enum';

@Controller('ticker-source')
export class TickerSourceController {
  constructor(private readonly tickerSourceService: TickerSourceService) {}

  @Get(':source/sync/status')
  @Auth()
  @ApiOkResponse({ type: TickerSourceSyncStatusDto })
  getSyncStatus(
    @Param('source', new ParseEnumPipe(TickerSourceType)) source: TickerSourceType,
  ): Promise<TickerSourceSyncStatusDto> {
    return this.tickerSourceService.getSyncStatus(source);
  }

  @Post(':source/sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  sync(
    @Param('source', new ParseEnumPipe(TickerSourceType)) source: TickerSourceType,
  ): Promise<void> {
    return source === TickerSourceType.Xtb
      ? this.tickerSourceService.syncXtb()
      : this.tickerSourceService.syncYahoo();
  }
}
