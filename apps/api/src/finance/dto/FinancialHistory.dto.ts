import { ApiProperty } from '@nestjs/swagger';

export class AnnualFinancialPeriodDto {
  @ApiProperty()
  periodEnd: Date;

  @ApiProperty({ nullable: true, type: Number })
  revenue: number | null;

  @ApiProperty({ nullable: true, type: Number })
  ebitda: number | null;

  @ApiProperty({ nullable: true, type: Number })
  netIncome: number | null;

  @ApiProperty({ nullable: true, type: Number })
  operatingCashflow: number | null;

  @ApiProperty({ nullable: true, type: Number })
  capex: number | null;

  @ApiProperty({ nullable: true, type: Number })
  freeCashflow: number | null;

  @ApiProperty({ nullable: true, type: Number })
  cash: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalDebt: number | null;

  @ApiProperty({ nullable: true, type: Number })
  netDebt: number | null;

  constructor(
    periodEnd: Date,
    revenue: number | null,
    ebitda: number | null,
    netIncome: number | null,
    operatingCashflow: number | null,
    capex: number | null,
    freeCashflow: number | null,
    cash: number | null,
    totalDebt: number | null,
    netDebt: number | null,
  ) {
    this.periodEnd = periodEnd;
    this.revenue = revenue;
    this.ebitda = ebitda;
    this.netIncome = netIncome;
    this.operatingCashflow = operatingCashflow;
    this.capex = capex;
    this.freeCashflow = freeCashflow;
    this.cash = cash;
    this.totalDebt = totalDebt;
    this.netDebt = netDebt;
  }
}

export class FinancialHistoryDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ type: AnnualFinancialPeriodDto, isArray: true })
  annual: AnnualFinancialPeriodDto[];

  constructor(ticker: string, annual: AnnualFinancialPeriodDto[]) {
    this.ticker = ticker;
    this.annual = annual;
  }
}
