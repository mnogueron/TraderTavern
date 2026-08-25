import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { BrokerService } from './broker.service';
import { BrokerConnectionDto } from './dto/BrokerConnection.dto';
import { AddBrokerConnectionDto } from './dto/AddBrokerConnection.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('broker')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  @Get('connections')
  @Auth()
  @ApiOkResponse({ type: [BrokerConnectionDto] })
  list(@CurrentUser() user: JwtPayload): Promise<BrokerConnectionDto[]> {
    return this.brokerService.list(user.sub);
  }

  @Post('connections')
  @Auth()
  @ApiOkResponse({ type: BrokerConnectionDto })
  add(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddBrokerConnectionDto,
  ): Promise<BrokerConnectionDto> {
    return this.brokerService.add(user.sub, dto);
  }

  @Delete('connections/:id')
  @HttpCode(204)
  @Auth()
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.brokerService.remove(user.sub, id);
  }
}
