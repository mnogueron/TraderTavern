import { ApiProperty } from '@nestjs/swagger';

export class ScreenerFilterOptionsDto {
  @ApiProperty({ type: String, isArray: true })
  sectors!: string[];

  @ApiProperty({ type: String, isArray: true })
  industries!: string[];

  @ApiProperty({ type: String, isArray: true })
  countries!: string[];

  @ApiProperty({ type: String, isArray: true })
  markets!: string[];

  @ApiProperty({ type: String, isArray: true })
  currencies!: string[];

  @ApiProperty({ type: String, isArray: true })
  analystRatings!: string[];

  constructor(fields: {
    sectors: string[];
    industries: string[];
    countries: string[];
    markets: string[];
    currencies: string[];
    analystRatings: string[];
  }) {
    Object.assign(this, fields);
  }
}
