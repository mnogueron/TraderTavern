import type { ApiResponse } from '@trader-tavern/api-client';

export type Fundamental = ApiResponse<'get', '/finance/ticker/{id}/fundamental'>;
export type FinancialHistory = ApiResponse<
  'get',
  '/finance/ticker/{id}/financial-history'
>;
export type AnnualFinancialPeriod = FinancialHistory['annual'][number];
export type EarningsHistory = ApiResponse<
  'get',
  '/finance/ticker/{id}/earnings-history'
>;
