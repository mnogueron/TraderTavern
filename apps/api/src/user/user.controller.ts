import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { PaginationDto } from '../shared/Pagination.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { PaginatedUserDto } from './PaginatedUser.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../shared/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth(Role.Admin)
  @ApiOkResponse({ type: PaginatedUserDto })
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.getAll(paginationDto);
  }
}
