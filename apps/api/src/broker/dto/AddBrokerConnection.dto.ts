import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject } from 'class-validator';
import { BrokerType } from '../enums/broker-type.enum';

export class AddBrokerConnectionDto {
  @ApiProperty({ enum: BrokerType })
  @IsEnum(BrokerType)
  broker!: BrokerType;

  @ApiProperty({
    type: Object,
    description: 'Broker-specific credential fields (e.g. email/password, or apiKey)',
  })
  @IsObject()
  credentials!: Record<string, string>;
}
