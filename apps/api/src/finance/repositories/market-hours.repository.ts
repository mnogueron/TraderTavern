import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketHours, MarketHoursDocument } from '../schemas/market-hours.schema';

@Injectable()
export class MarketHoursRepository {
  constructor(
    @InjectModel(MarketHours.name)
    private readonly marketHoursModel: Model<MarketHoursDocument>,
  ) {}

  async findAll(): Promise<MarketHours[]> {
    return this.marketHoursModel.find().lean();
  }

  async findByMarket(market: string): Promise<MarketHours | null> {
    return this.marketHoursModel.findOne({ market }).lean();
  }
}
