import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TickerSourceType } from '../../ticker-source/enums/ticker-source-type.enum';

export class UpdateUserSettingsDto {
  @ApiProperty({ enum: TickerSourceType })
  @IsEnum(TickerSourceType)
  tickerSource!: TickerSourceType;
}
