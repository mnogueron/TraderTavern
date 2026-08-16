import createFetchClient from 'openapi-fetch';
import createClient, { type OpenapiQueryClient } from 'openapi-react-query';
import type { paths } from '../api';

export type QueryClient = OpenapiQueryClient<paths, `${string}/${string}`>;
export type UseQueryClient = QueryClient['useQuery'];

let api: QueryClient | undefined = undefined;

export const initClient = (baseUrl: string) => {
  const fetchClient = createFetchClient<paths>({
    baseUrl,
  });

  api = createClient(fetchClient);
};

const notInitializedClient = () => {
  throw new Error('Cannot use client query before initClient');
};

export const useClientQuery = ((...params: unknown[]) => {
  if (typeof api === 'undefined') {
    return notInitializedClient();
  }

  const { data } = api.useQuery('get', '/user');

  return (api.useQuery as (...args: unknown[]) => unknown)(...params);
}) as UseQueryClient;
