import { ApiProperty } from '@nestjs/swagger';

export class EpsPeriodDto {
  @ApiProperty()
  quarter: Date;

  @ApiProperty({ nullable: true, type: Number })
  actual: number | null;

  @ApiProperty({ nullable: true, type: Number })
  estimate: number | null;

  constructor(quarter: Date, actual: number | null, estimate: number | null) {
    this.quarter = quarter;
    this.actual = actual;
    this.estimate = estimate;
  }
}

export class RevenuePeriodDto {
  @ApiProperty()
  quarter: Date;

  @ApiProperty({ nullable: true, type: Number })
  actual: number | null;

  constructor(quarter: Date, actual: number | null) {
    this.quarter = quarter;
    this.actual = actual;
  }
}

export class EarningsHistoryDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ type: EpsPeriodDto, isArray: true })
  eps: EpsPeriodDto[];

  @ApiProperty({ type: RevenuePeriodDto, isArray: true })
  revenue: RevenuePeriodDto[];

  constructor(
    ticker: string,
    eps: EpsPeriodDto[],
    revenue: RevenuePeriodDto[],
  ) {
    this.ticker = ticker;
    this.eps = eps;
    this.revenue = revenue;
  }
}
