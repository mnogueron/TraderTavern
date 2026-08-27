import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { TickerOptionDto } from './TickerOption.dto';

export class PaginatedTickerOptionDto extends PaginatedResponseDto(TickerOptionDto) {}
