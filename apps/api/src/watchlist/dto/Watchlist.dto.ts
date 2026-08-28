import { ApiProperty } from '@nestjs/swagger';

export class WatchlistDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ type: String, isArray: true })
  tickers!: string[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(fields: {
    id: string;
    name: string;
    description: string | null;
    tickers: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    Object.assign(this, fields);
  }
}
