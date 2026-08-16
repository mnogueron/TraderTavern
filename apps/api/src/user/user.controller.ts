import {Controller, Get, Query} from '@nestjs/common';
import {UserService} from "./user.service";
import {PaginationDto} from "../shared/Pagination.dto";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.getAll(paginationDto)
  }
}
