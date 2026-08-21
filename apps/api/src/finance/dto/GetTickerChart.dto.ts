import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CandleWindow } from '../enums/candle-window.enum';

export class GetTickerChartDto {
  @ApiProperty({ enum: CandleWindow })
  @IsEnum(CandleWindow)
  window!: CandleWindow;
}
