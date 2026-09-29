import { ApiProperty } from '@nestjs/swagger';
import { TickerSourceType } from '../ticker-source/enums/ticker-source-type.enum';
import { Locale } from './locale.enum';

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

  @ApiProperty({ enum: Locale })
  locale: Locale;

  constructor(
    id: string,
    username: string,
    email: string,
    role: string,
    tickerSource: TickerSourceType,
    locale: Locale,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
    this.tickerSource = tickerSource;
    this.locale = locale;
  }
}
