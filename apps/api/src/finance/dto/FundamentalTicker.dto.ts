import { ApiProperty } from '@nestjs/swagger';

export class FundamentalTickerDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ nullable: true, type: Number })
  marketCap: number | null;

  @ApiProperty({ nullable: true, type: Number })
  peRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  psRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  ebitda: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalDebt: number | null;

  @ApiProperty({ nullable: true, type: Number })
  debtToEquity: number | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'When this fundamental data was last refreshed',
  })
  refreshedAt: Date | null;

  constructor(
    ticker: string,
    marketCap: number | null,
    peRatio: number | null,
    psRatio: number | null,
    ebitda: number | null,
    totalDebt: number | null,
    debtToEquity: number | null,
    refreshedAt: Date | null,
  ) {
    this.ticker = ticker;
    this.marketCap = marketCap;
    this.peRatio = peRatio;
    this.psRatio = psRatio;
    this.ebitda = ebitda;
    this.totalDebt = totalDebt;
    this.debtToEquity = debtToEquity;
    this.refreshedAt = refreshedAt;
  }
}
