import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    FinanceModule,
    BrokerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
