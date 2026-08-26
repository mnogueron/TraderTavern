import { ApiProperty } from '@nestjs/swagger';
import { TickerSourceType } from '../enums/ticker-source-type.enum';

export class TickerSourceSyncStatusDto {
  @ApiProperty({ enum: TickerSourceType })
  source: TickerSourceType;

  @ApiProperty({ nullable: true, type: Date })
  lastSyncedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  sourceUpdatedAt: Date | null;

  @ApiProperty()
  tickerCount: number;

  @ApiProperty()
  isSyncing: boolean;

  constructor(
    source: TickerSourceType,
    lastSyncedAt: Date | null,
    sourceUpdatedAt: Date | null,
    tickerCount: number,
    isSyncing: boolean,
  ) {
    this.source = source;
    this.lastSyncedAt = lastSyncedAt;
    this.sourceUpdatedAt = sourceUpdatedAt;
    this.tickerCount = tickerCount;
    this.isSyncing = isSyncing;
  }
}
