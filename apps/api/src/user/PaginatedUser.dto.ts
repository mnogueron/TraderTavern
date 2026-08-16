import { PaginatedResponseDto } from '../shared/PaginatedResponse.dto';
import { UserDto } from '../shared/User.dto';

export class PaginatedUserDto extends PaginatedResponseDto(UserDto) {}
