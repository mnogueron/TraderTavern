import { ApiProperty } from '@nestjs/swagger';
import { TickerSourceType } from '../ticker-source/enums/ticker-source-type.enum';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ enum: TickerSourceType })
  tickerSource: TickerSourceType;

  constructor(
    id: string,
    username: string,
    email: string,
    role: string,
    tickerSource: TickerSourceType,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
    this.tickerSource = tickerSource;
  }
}
