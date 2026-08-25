import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { BrokerController } from './broker.controller';
import { BrokerService } from './broker.service';
import { XtbService } from './xtb/xtb.service';
import { EncryptionService } from '../shared/encryption.service';
import {
  BrokerConnection,
  BrokerConnectionSchema,
} from './schemas/broker-connection.schema';

@Module({
  imports: [
    AuthModule,
    FinanceModule,
    MongooseModule.forFeature([
      { name: BrokerConnection.name, schema: BrokerConnectionSchema },
    ]),
  ],
  controllers: [BrokerController],
  providers: [BrokerService, XtbService, EncryptionService],
})
export class BrokerModule {}
