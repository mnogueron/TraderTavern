import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TickerSourceType } from '../../ticker-source/enums/ticker-source-type.enum';
import { Locale } from '../../shared/locale.enum';

export class UpdateUserSettingsDto {
  @ApiProperty({ enum: TickerSourceType, required: false })
  @IsOptional()
  @IsEnum(TickerSourceType)
  tickerSource?: TickerSourceType;

  @ApiProperty({ enum: Locale, required: false })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
