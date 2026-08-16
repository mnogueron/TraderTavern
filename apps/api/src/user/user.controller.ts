import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { PaginationDto } from '../shared/Pagination.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../shared/PaginatedResponse.dto';
import { UserDto } from '../shared/User.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedResponseDto<UserDto> })
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.getAll(paginationDto);
  }
}
