import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @ValidateIf((dto: ResetPasswordDto) => dto.newPassword !== undefined)
  @IsNotEmpty()
  token?: string;

  @ApiProperty({ required: false })
  @ValidateIf((dto: ResetPasswordDto) => dto.token !== undefined)
  @MinLength(8)
  newPassword?: string;
}
