import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTickersDto {
  @ApiProperty({ description: 'Comma-separated list of ticker symbols' })
  @IsString()
  @IsNotEmpty()
  tickers!: string;
}
