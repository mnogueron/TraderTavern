import { useClientQuery } from '@trader-tavern/api-client';

export const useCurrentUser = () => {
  return useClientQuery('get', '/auth/me', undefined, { retry: false });
};
