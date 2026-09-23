import { useClientQuery } from '@trader-tavern/api-client';

export const useCurrentUser = () => {
  return useClientQuery('get', '/api/auth/me', undefined, { retry: false });
};
