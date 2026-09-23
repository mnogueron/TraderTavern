import type { ApiResponse } from '@trader-tavern/api-client';

export type AltmanHistory = ApiResponse<
  'get',
  '/api/finance/ticker/{id}/altman-history'
>;
export type AltmanScorePoint = AltmanHistory['history'][number];
