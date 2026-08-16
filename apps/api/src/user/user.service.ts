import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../shared/Pagination.dto';
import { PaginatedDto } from '../shared/Paginated.dto';

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const roles = ['admin', 'moderator', 'user'];

function generateRandomUsers(count: number): User[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      username: `user${id}`,
      email: `user${id}@example.com`,
      role: roles[Math.floor(Math.random() * roles.length)],
    };
  });
}

@Injectable()
export class UserService {
  getAll(paginationDto: PaginationDto): PaginatedDto<User> {
    const { limit = 10, page = 1 } = paginationDto;
    const users = generateRandomUsers(200);
    return new PaginatedDto(
      users.slice((page - 1) * limit, page * limit),
      page,
      limit,
      users.length,
      Math.ceil(users.length / limit),
    );
  }
}
