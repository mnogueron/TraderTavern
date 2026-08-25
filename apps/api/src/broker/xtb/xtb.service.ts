import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import WebSocket from 'ws';
import { TickerBind, TickerBindDocument } from '../../finance/schemas/ticker-bind.schema';
import {
  TickerStaticData,
  TickerStaticDataDocument,
} from '../../finance/schemas/ticker-static-data.schema';
import { BrokerType } from '../enums/broker-type.enum';

const XTB_WS_URL = 'wss://ws.xtb.com/real';
const RESPONSE_TIMEOUT_MS = 15_000;

interface XtbSymbol {
  symbol: string;
}

interface XtbResponse {
  status: boolean;
  returnData?: unknown;
  errorDescr?: string;
}

@Injectable()
export class XtbService {
  private readonly logger = new Logger(XtbService.name);

  constructor(
    @InjectModel(TickerBind.name)
    private readonly tickerBindModel: Model<TickerBindDocument>,
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
  ) {}

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(XTB_WS_URL);
      socket.once('open', () => resolve(socket));
      socket.once('error', (error) => reject(error));
    });
  }

  private send(
    socket: WebSocket,
    command: string,
    args?: Record<string, unknown>,
  ): Promise<XtbResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('message', onMessage);
        reject(new Error(`XTB command "${command}" timed out`));
      }, RESPONSE_TIMEOUT_MS);

      const onMessage = (data: WebSocket.RawData) => {
        clearTimeout(timeout);
        socket.off('message', onMessage);
        try {
          resolve(JSON.parse(data.toString()) as XtbResponse);
        } catch (error) {
          reject(error);
        }
      };

      socket.on('message', onMessage);
      socket.send(
        JSON.stringify(
          args ? { command, arguments: args } : { command },
        ),
      );
    });
  }

  private async login(
    socket: WebSocket,
    credentials: Record<string, string>,
  ): Promise<void> {
    const response = await this.send(socket, 'login', {
      userId: credentials.email,
      password: credentials.password,
    });

    if (!response.status) {
      throw new UnauthorizedException(
        response.errorDescr ?? 'XTB login failed',
      );
    }
  }

  private async logout(socket: WebSocket): Promise<void> {
    try {
      await this.send(socket, 'logout');
    } finally {
      socket.close();
    }
  }

  async testLogin(credentials: Record<string, string>): Promise<void> {
    const socket = await this.connect();
    try {
      await this.login(socket, credentials);
    } finally {
      await this.logout(socket);
    }
  }

  async syncTickers(
    userId: string,
    credentials: Record<string, string>,
  ): Promise<void> {
    const socket = await this.connect();
    let symbols: XtbSymbol[] = [];

    try {
      await this.login(socket, credentials);
      const response = await this.send(socket, 'getAllSymbols');
      symbols = Array.isArray(response.returnData)
        ? (response.returnData as XtbSymbol[])
        : [];
    } finally {
      await this.logout(socket);
    }

    const xtbBaseSymbols = new Set(
      symbols.map((symbol) => symbol.symbol.split('.')[0].toUpperCase()),
    );

    const knownTickers = await this.tickerStaticDataModel
      .find()
      .select('ticker')
      .lean();

    const matchedTickers = knownTickers
      .map((ticker) => ticker.ticker)
      .filter((ticker) => xtbBaseSymbols.has(ticker.toUpperCase()));

    await this.tickerBindModel.updateOne(
      { userId: new Types.ObjectId(userId), source: BrokerType.Xtb },
      { $set: { tickers: matchedTickers } },
      { upsert: true },
    );

    this.logger.log(
      `XTB ticker sync for user ${userId}: matched ${matchedTickers.length} tickers`,
    );
  }
}
