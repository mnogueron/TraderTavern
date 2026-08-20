import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { TickerDto } from './dto/Ticker.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('screener')
  @Auth()
  @ApiOkResponse({ type: TickerDto, isArray: true })
  getScreener(): Promise<TickerDto[]> {
    return this.financeService.getScreener();
  }
}
