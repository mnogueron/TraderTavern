import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiParam({ name: 'source', enum: TickerSourceType })
  @ApiOkResponse({ type: TickerSourceSyncStatusDto })
  getTickerSourceSyncStatus(
    @Param('source', new ParseEnumPipe(TickerSourceType)) source: TickerSourceType,
  ): Promise<TickerSourceSyncStatusDto> {
    return this.tickerSourceService.getSyncStatus(source);
  }

  @Post('yahoo/sync')
  @HttpCode(204)
  @Auth(Role.Admin)
  syncYahoo(): Promise<void> {
    return this.tickerSourceService.syncYahoo();
  }

  @Post('xtb/sync/upload')
  @HttpCode(204)
  @Auth(Role.Admin)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  syncXtb(@UploadedFile() file?: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('An OMI PDF file is required');
    }
    return this.tickerSourceService.syncXtbFromBuffer(file.buffer);
  }
}
