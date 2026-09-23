import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TriggerSyncDto {
  @ApiProperty({
    required: false,
    description:
      'Comma-separated list of markets to scope the sync to; omit to sync every market',
  })
  @IsOptional()
  @IsString()
  markets?: string;
}
