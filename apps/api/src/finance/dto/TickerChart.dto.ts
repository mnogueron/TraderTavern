import { ApiProperty } from '@nestjs/swagger';
import { CandleWindow } from '../enums/candle-window.enum';
import { CandleDto } from './Candle.dto';

export class TickerChartDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ enum: CandleWindow })
  window: CandleWindow;

  @ApiProperty({ type: CandleDto, isArray: true })
  candles: CandleDto[];

  constructor(ticker: string, window: CandleWindow, candles: CandleDto[]) {
    this.ticker = ticker;
    this.window = window;
    this.candles = candles;
  }
}
