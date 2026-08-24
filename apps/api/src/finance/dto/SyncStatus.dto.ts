import { ApiProperty } from '@nestjs/swagger';

export class SyncStatusDto {
  @ApiProperty({ nullable: true, type: Date })
  lastSyncDate: Date | null;

  constructor(lastSyncDate: Date | null) {
    this.lastSyncDate = lastSyncDate;
  }
}
