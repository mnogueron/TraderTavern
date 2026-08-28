import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { WatchlistDto } from './dto/Watchlist.dto';
import { CreateWatchlistDto } from './dto/CreateWatchlist.dto';
import { UpdateWatchlistDto } from './dto/UpdateWatchlist.dto';
import { AddWatchlistTickerDto } from './dto/AddWatchlistTicker.dto';
import { SetWatchlistMembershipDto } from './dto/SetWatchlistMembership.dto';
import { WatchlistMembershipDto } from './dto/WatchlistMembership.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('watchlists')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @Auth()
  @ApiOkResponse({ type: WatchlistDto, isArray: true })
  getAll(@CurrentUser() user: JwtPayload): Promise<WatchlistDto[]> {
    return this.watchlistService.getAll(user.sub);
  }

  @Post()
  @Auth()
  @ApiOkResponse({ type: WatchlistDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWatchlistDto,
  ): Promise<WatchlistDto> {
    return this.watchlistService.create(user.sub, dto);
  }

  @Get('membership/:ticker')
  @Auth()
  @ApiOkResponse({ type: WatchlistMembershipDto })
  getMembership(
    @CurrentUser() user: JwtPayload,
    @Param('ticker') ticker: string,
  ): Promise<WatchlistMembershipDto> {
    return this.watchlistService.getMembership(user.sub, ticker);
  }

  @Put('membership/:ticker')
  @Auth()
  @HttpCode(204)
  setMembership(
    @CurrentUser() user: JwtPayload,
    @Param('ticker') ticker: string,
    @Body() dto: SetWatchlistMembershipDto,
  ): Promise<void> {
    return this.watchlistService.setMembership(
      user.sub,
      ticker,
      dto.watchlistIds,
    );
  }

  @Get(':id')
  @Auth()
  @ApiOkResponse({ type: WatchlistDto })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<WatchlistDto> {
    return this.watchlistService.getById(user.sub, id);
  }

  @Patch(':id')
  @Auth()
  @ApiOkResponse({ type: WatchlistDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWatchlistDto,
  ): Promise<WatchlistDto> {
    return this.watchlistService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(204)
  delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.watchlistService.delete(user.sub, id);
  }

  @Post(':id/tickers')
  @Auth()
  @ApiOkResponse({ type: WatchlistDto })
  addTicker(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddWatchlistTickerDto,
  ): Promise<WatchlistDto> {
    return this.watchlistService.addTicker(user.sub, id, dto.ticker);
  }

  @Delete(':id/tickers/:ticker')
  @Auth()
  @ApiOkResponse({ type: WatchlistDto })
  removeTicker(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('ticker') ticker: string,
  ): Promise<WatchlistDto> {
    return this.watchlistService.removeTicker(user.sub, id, ticker);
  }
}
