import { ApiProperty } from '@nestjs/swagger';

export class WatchlistMembershipDto {
  @ApiProperty({ type: String, isArray: true })
  watchlistIds!: string[];

  constructor(watchlistIds: string[]) {
    this.watchlistIds = watchlistIds;
  }
}
