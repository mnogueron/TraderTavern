import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiProperty()
  @IsString()
  tickerSource!: string;
}
