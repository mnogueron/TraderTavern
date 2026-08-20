import createFetchClient from 'openapi-fetch';
import createClient, {
  type MethodResponse,
  type OpenapiQueryClient,
} from 'openapi-react-query';
import type { HttpMethod, PathsWithMethod } from 'openapi-typescript-helpers';
import type { paths, components } from '../api';

export type { paths, components };

export type QueryClient = OpenapiQueryClient<paths, `${string}/${string}`>;
export type UseQueryClient = QueryClient['useQuery'];
export type UseInfiniteQueryClient = QueryClient['useInfiniteQuery'];
export type UseMutationClient = QueryClient['useMutation'];

// Resolves the exact `data` type returned by `useClientQuery(method, path)`,
// so response types stay derived from the OpenAPI schema instead of being
// hand-picked/deconstructed from a DTO.
export type ApiResponse<
  Method extends HttpMethod,
  Path extends PathsWithMethod<paths, Method>,
> = MethodResponse<QueryClient, Method, Path>;

let api: QueryClient | undefined = undefined;

const AUTH_PATH_PREFIX = '/auth';

export const initClient = (baseUrl: string) => {
  const fetchClient = createFetchClient<paths>({
    baseUrl,
    credentials: 'include',
  });

  fetchClient.use({
    onResponse: ({ request, response }) => {
      const isAuthPath = new URL(request.url).pathname.startsWith(
        AUTH_PATH_PREFIX,
      );

      if (response.status === 401 && !isAuthPath) {
        window.location.assign('/login');
      }

      return response;
    },
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

  return (api.useQuery as (...args: unknown[]) => unknown)(...params);
}) as UseQueryClient;

export const useClientInfiniteQuery = ((...params: unknown[]) => {
  if (typeof api === 'undefined') {
    return notInitializedClient();
  }

  return (api.useInfiniteQuery as (...args: unknown[]) => unknown)(...params);
}) as UseInfiniteQueryClient;

export const useClientMutation = ((...params: unknown[]) => {
  if (typeof api === 'undefined') {
    return notInitializedClient();
  }

  return (api.useMutation as (...args: unknown[]) => unknown)(...params);
}) as UseMutationClient;
