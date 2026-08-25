import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BrokerConnection,
  BrokerConnectionDocument,
} from './schemas/broker-connection.schema';
import { BrokerConnectionDto } from './dto/BrokerConnection.dto';
import { AddBrokerConnectionDto } from './dto/AddBrokerConnection.dto';
import { BROKER_CREDENTIAL_FIELDS } from './broker-credential-fields';
import { BrokerConnectionStatus } from './enums/broker-connection-status.enum';
import { EncryptionService } from '../shared/encryption.service';
import { XtbService } from './xtb/xtb.service';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    @InjectModel(BrokerConnection.name)
    private readonly brokerConnectionModel: Model<BrokerConnectionDocument>,
    private readonly encryptionService: EncryptionService,
    private readonly xtbService: XtbService,
  ) {}

  private toDto(connection: BrokerConnectionDocument): BrokerConnectionDto {
    const fields = BROKER_CREDENTIAL_FIELDS[connection.broker];
    const credentials: Record<string, string> = {};

    for (const field of fields) {
      if (field.secret) {
        continue;
      }
      const value = connection.credentials[field.key];
      credentials[field.key] = field.mask ? field.mask(value) : value;
    }

    return new BrokerConnectionDto(
      connection._id.toString(),
      connection.broker,
      credentials,
      connection.status,
    );
  }

  private validateCredentialKeys(
    broker: BrokerConnection['broker'],
    credentials: Record<string, string>,
  ): void {
    const fields = BROKER_CREDENTIAL_FIELDS[broker];
    const expectedKeys = fields.map((field) => field.key);
    const providedKeys = Object.keys(credentials);

    const missing = expectedKeys.filter((key) => !providedKeys.includes(key));
    const extra = providedKeys.filter((key) => !expectedKeys.includes(key));

    if (missing.length > 0 || extra.length > 0) {
      throw new BadRequestException(
        `Invalid credentials for broker ${broker}: expected [${expectedKeys.join(', ')}]`,
      );
    }
  }

  async list(userId: string): Promise<BrokerConnectionDto[]> {
    const connections = await this.brokerConnectionModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    return connections.map((connection) => this.toDto(connection));
  }

  async add(
    userId: string,
    dto: AddBrokerConnectionDto,
  ): Promise<BrokerConnectionDto> {
    this.validateCredentialKeys(dto.broker, dto.credentials);

    await this.xtbService.testLogin(dto.credentials);

    const fields = BROKER_CREDENTIAL_FIELDS[dto.broker];
    const storedCredentials: Record<string, string> = {};
    for (const field of fields) {
      const value = dto.credentials[field.key];
      storedCredentials[field.key] = field.secret
        ? this.encryptionService.encrypt(value)
        : value;
    }

    const connection = await this.brokerConnectionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), broker: dto.broker },
      {
        userId: new Types.ObjectId(userId),
        broker: dto.broker,
        credentials: storedCredentials,
        status: BrokerConnectionStatus.Connected,
      },
      { upsert: true, new: true },
    );

    this.xtbService.syncTickers(userId, dto.credentials).catch((error) => {
      this.logger.error(
        `XTB ticker sync failed for user ${userId}: ${error}`,
      );
    });

    return this.toDto(connection);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.brokerConnectionModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Broker connection not found');
    }
  }

  async getDecryptedCredentials(
    userId: string,
    broker: BrokerConnection['broker'],
  ): Promise<Record<string, string>> {
    const connection = await this.brokerConnectionModel.findOne({
      userId: new Types.ObjectId(userId),
      broker,
    });

    if (!connection) {
      throw new NotFoundException('Broker connection not found');
    }

    const fields = BROKER_CREDENTIAL_FIELDS[broker];
    const credentials: Record<string, string> = {};
    for (const field of fields) {
      const value = connection.credentials[field.key];
      credentials[field.key] = field.secret
        ? this.encryptionService.decrypt(value)
        : value;
    }

    return credentials;
  }
}
