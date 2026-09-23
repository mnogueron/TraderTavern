import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { HiddenTickerDto } from './HiddenTicker.dto';

export class PaginatedHiddenTickerDto extends PaginatedResponseDto(HiddenTickerDto) {}
