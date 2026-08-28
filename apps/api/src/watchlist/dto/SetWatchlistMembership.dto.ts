import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetWatchlistMembershipDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Ids of the watchlists the ticker should belong to',
  })
  @IsArray()
  @IsString({ each: true })
  watchlistIds!: string[];
}
