import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Watchlist, WatchlistDocument } from './schemas/watchlist.schema';
import { WatchlistDto } from './dto/Watchlist.dto';
import { CreateWatchlistDto } from './dto/CreateWatchlist.dto';
import { UpdateWatchlistDto } from './dto/UpdateWatchlist.dto';
import { WatchlistMembershipDto } from './dto/WatchlistMembership.dto';

type WithTimestamps = { createdAt: Date; updatedAt: Date };

@Injectable()
export class WatchlistService {
  constructor(
    @InjectModel(Watchlist.name)
    private readonly watchlistModel: Model<WatchlistDocument>,
  ) {}

  private toDto(doc: WatchlistDocument): WatchlistDto {
    const { createdAt, updatedAt } = doc as WatchlistDocument & WithTimestamps;
    return new WatchlistDto({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description ?? null,
      tickers: doc.tickers,
      createdAt,
      updatedAt,
    });
  }

  async getAll(userId: string): Promise<WatchlistDto[]> {
    const docs = await this.watchlistModel
      .find({ userId })
      .sort({ name: 1 })
      .exec();
    return docs.map((doc) => this.toDto(doc));
  }

  async getById(userId: string, id: string): Promise<WatchlistDto> {
    const doc = await this.findOwned(userId, id);
    return this.toDto(doc);
  }

  async create(userId: string, dto: CreateWatchlistDto): Promise<WatchlistDto> {
    const doc = await this.watchlistModel.create({
      userId,
      name: dto.name,
      description: dto.description,
      tickers: [],
    });
    return this.toDto(doc);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateWatchlistDto,
  ): Promise<WatchlistDto> {
    const doc = await this.findOwned(userId, id);
    if (dto.name !== undefined) {
      doc.name = dto.name;
    }
    if (dto.description !== undefined) {
      doc.description = dto.description;
    }
    await doc.save();
    return this.toDto(doc);
  }

  async delete(userId: string, id: string): Promise<void> {
    const doc = await this.findOwned(userId, id);
    await doc.deleteOne();
  }

  async addTicker(
    userId: string,
    id: string,
    ticker: string,
  ): Promise<WatchlistDto> {
    const doc = await this.findOwned(userId, id);
    const normalized = ticker.toUpperCase();
    if (!doc.tickers.includes(normalized)) {
      doc.tickers.push(normalized);
      await doc.save();
    }
    return this.toDto(doc);
  }

  async removeTicker(
    userId: string,
    id: string,
    ticker: string,
  ): Promise<WatchlistDto> {
    const doc = await this.findOwned(userId, id);
    const normalized = ticker.toUpperCase();
    doc.tickers = doc.tickers.filter((t) => t !== normalized);
    await doc.save();
    return this.toDto(doc);
  }

  async getMembership(
    userId: string,
    ticker: string,
  ): Promise<WatchlistMembershipDto> {
    const normalized = ticker.toUpperCase();
    const docs = await this.watchlistModel
      .find({ userId, tickers: normalized })
      .select('_id')
      .exec();
    return new WatchlistMembershipDto(docs.map((doc) => doc._id.toString()));
  }

  async setMembership(
    userId: string,
    ticker: string,
    watchlistIds: string[],
  ): Promise<void> {
    const normalized = ticker.toUpperCase();
    const requestedIds = new Set(watchlistIds);

    const owned = await this.watchlistModel.find({ userId }).exec();
    const ownedIds = new Set(owned.map((doc) => doc._id.toString()));

    for (const id of requestedIds) {
      if (!ownedIds.has(id)) {
        throw new ForbiddenException(`Watchlist ${id} not found`);
      }
    }

    await Promise.all(
      owned.map((doc) => {
        const id = doc._id.toString();
        const shouldContain = requestedIds.has(id);
        const contains = doc.tickers.includes(normalized);

        if (shouldContain && !contains) {
          return this.watchlistModel
            .updateOne({ _id: doc._id }, { $addToSet: { tickers: normalized } })
            .exec();
        }
        if (!shouldContain && contains) {
          return this.watchlistModel
            .updateOne({ _id: doc._id }, { $pull: { tickers: normalized } })
            .exec();
        }
        return Promise.resolve();
      }),
    );
  }

  private async findOwned(
    userId: string,
    id: string,
  ): Promise<WatchlistDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Watchlist ${id} not found`);
    }
    const doc = await this.watchlistModel.findOne({ _id: id, userId }).exec();
    if (!doc) {
      throw new NotFoundException(`Watchlist ${id} not found`);
    }
    return doc;
  }
}
