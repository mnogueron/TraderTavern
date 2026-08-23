import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { TickerDto } from './Ticker.dto';

export class PaginatedTickerDto extends PaginatedResponseDto(TickerDto) {}
