import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty()
  @MinLength(8)
  newPassword!: string;
}
