import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../shared/Pagination.dto';
import { PaginatedUserDto } from './PaginatedUser.dto';
import { UserDto } from '../shared/User.dto';
import { User, UserDocument } from './schemas/user.schema';
import { BrokerType } from '../broker/enums/broker-type.enum';

const YAHOO_FINANCE_SOURCE = 'yahoo-finance';
const VALID_TICKER_SOURCES: string[] = [
  YAHOO_FINANCE_SOURCE,
  ...Object.values(BrokerType),
];

const toUserDto = (user: UserDocument): UserDto =>
  new UserDto(
    user._id.toString(),
    user.username,
    user.email,
    user.role,
    user.tickerSource,
  );

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getAll(paginationDto: PaginationDto): Promise<PaginatedUserDto> {
    const { limit = 10, page = 1 } = paginationDto;

    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return new PaginatedUserDto(
      users.map(toUserDto),
      page,
      limit,
      total,
      Math.ceil(total / limit),
    );
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(user: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  toDto(user: UserDocument): UserDto {
    return toUserDto(user);
  }

  async updateSettings(
    userId: string,
    settings: { tickerSource: string },
  ): Promise<UserDto> {
    if (!VALID_TICKER_SOURCES.includes(settings.tickerSource)) {
      throw new BadRequestException(
        `Invalid ticker source: ${settings.tickerSource}`,
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { tickerSource: settings.tickerSource },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return toUserDto(user);
  }
}
