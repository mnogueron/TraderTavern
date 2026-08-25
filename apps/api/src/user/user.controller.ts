import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { PaginationDto } from '../shared/Pagination.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { PaginatedUserDto } from './PaginatedUser.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { Role } from '../shared/role.enum';
import { UserDto } from '../shared/User.dto';
import { UpdateUserSettingsDto } from './dto/UpdateUserSettings.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth(Role.Admin)
  @ApiOkResponse({ type: PaginatedUserDto })
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.getAll(paginationDto);
  }

  @Patch('me/settings')
  @Auth()
  @ApiOkResponse({ type: UserDto })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserDto> {
    return this.userService.updateSettings(user.sub, dto);
  }
}
