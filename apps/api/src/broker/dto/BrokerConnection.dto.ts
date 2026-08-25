import { ApiProperty } from '@nestjs/swagger';
import { BrokerType } from '../enums/broker-type.enum';
import { BrokerConnectionStatus } from '../enums/broker-connection-status.enum';

export class BrokerConnectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BrokerType })
  broker: BrokerType;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Broker credential fields with secret fields omitted and sensitive fields masked',
  })
  credentials: Record<string, string>;

  @ApiProperty({ enum: BrokerConnectionStatus })
  status: BrokerConnectionStatus;

  constructor(
    id: string,
    broker: BrokerType,
    credentials: Record<string, string>,
    status: BrokerConnectionStatus,
  ) {
    this.id = id;
    this.broker = broker;
    this.credentials = credentials;
    this.status = status;
  }
}
