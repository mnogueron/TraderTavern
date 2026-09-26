import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { TickerSummaryDto } from './TickerSummary.dto';

export class PaginatedTickerSummaryDto extends PaginatedResponseDto(TickerSummaryDto) {}
