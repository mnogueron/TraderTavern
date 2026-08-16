import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  constructor(id: number, username: string, email: string, role: string) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
  }
}
