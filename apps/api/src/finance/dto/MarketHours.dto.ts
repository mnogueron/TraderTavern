import { ApiProperty } from '@nestjs/swagger';

export class MarketHoursDto {
  @ApiProperty()
  market: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ description: 'IANA timezone name, e.g. America/New_York' })
  timezone: string;

  @ApiProperty({ nullable: true, type: String, description: 'HH:mm, local to timezone' })
  preMarketOpen: string | null;

  @ApiProperty({ description: 'HH:mm, local to timezone' })
  regularOpen: string;

  @ApiProperty({ description: 'HH:mm, local to timezone' })
  regularClose: string;

  @ApiProperty({ nullable: true, type: String, description: 'HH:mm, local to timezone' })
  postMarketClose: string | null;

  @ApiProperty({
    type: [Number],
    description: 'Day-of-week indices (0 = Sunday) this market trades on',
  })
  tradingDays: number[];

  constructor(
    market: string,
    label: string,
    timezone: string,
    preMarketOpen: string | null,
    regularOpen: string,
    regularClose: string,
    postMarketClose: string | null,
    tradingDays: number[],
  ) {
    this.market = market;
    this.label = label;
    this.timezone = timezone;
    this.preMarketOpen = preMarketOpen;
    this.regularOpen = regularOpen;
    this.regularClose = regularClose;
    this.postMarketClose = postMarketClose;
    this.tradingDays = tradingDays;
  }
}
