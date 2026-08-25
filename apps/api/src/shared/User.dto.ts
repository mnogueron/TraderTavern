import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  tickerSource: string;

  constructor(
    id: string,
    username: string,
    email: string,
    role: string,
    tickerSource: string,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
    this.tickerSource = tickerSource;
  }
}
