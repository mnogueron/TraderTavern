import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ required: false })
  token?: string;

  @ApiProperty({ required: false })
  success?: boolean;
}
