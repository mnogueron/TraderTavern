import { ApiProperty } from '@nestjs/swagger';

export class MarketSummaryDto {
  @ApiProperty({
    description:
      'Raw exchange code as used by ticker_static_data.market and sync scheduling (e.g. "NMS", "PAR")',
  })
  market: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Friendly market_hours label, null if this market has no configured hours yet',
  })
  label: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastCompleteSync: string | null;

  constructor(market: string, label: string | null, lastCompleteSync: string | null) {
    this.market = market;
    this.label = label;
    this.lastCompleteSync = lastCompleteSync;
  }
}
