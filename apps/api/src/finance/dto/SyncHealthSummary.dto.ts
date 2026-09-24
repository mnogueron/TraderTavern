import { ApiProperty } from '@nestjs/swagger';

export class SyncHealthSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  healthyCount: number;

  @ApiProperty()
  unhealthyCount: number;

  // 100 when there are no eligible tickers yet, so the summary card reads
  // as "fully healthy" rather than a misleading 0%.
  @ApiProperty()
  healthyPercentage: number;

  constructor(total: number, healthyCount: number, unhealthyCount: number) {
    this.total = total;
    this.healthyCount = healthyCount;
    this.unhealthyCount = unhealthyCount;
    this.healthyPercentage = total === 0 ? 100 : (healthyCount / total) * 100;
  }
}
