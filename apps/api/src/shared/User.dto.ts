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

  constructor(id: string, username: string, email: string, role: string) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
  }
}
