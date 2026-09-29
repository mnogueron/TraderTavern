import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTickerOptionsByIsinDto {
  @ApiProperty({ description: 'Comma-separated list of ISINs' })
  @IsString()
  @IsNotEmpty()
  isins!: string;
}
