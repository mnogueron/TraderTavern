import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../shared/Pagination.dto';
import { PaginatedUserDto } from './PaginatedUser.dto';
import { UserDto } from '../shared/User.dto';
import { User, UserDocument } from './schemas/user.schema';
import { TickerSourceType } from '../ticker-source/enums/ticker-source-type.enum';

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

  async findByIds(ids: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  async updateTickerSource(
    id: string,
    tickerSource: TickerSourceType,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, { tickerSource }, { new: true }).exec();
  }

  async updateEmail(id: string, email: string): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing && existing._id.toString() !== id) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { email }, { new: true })
      .exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async create(user: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  async getDistinctTickerSources(): Promise<TickerSourceType[]> {
    return this.userModel.distinct('tickerSource');
  }

  toDto(user: UserDocument): UserDto {
    return toUserDto(user);
  }
}
