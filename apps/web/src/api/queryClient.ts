import { QueryClient } from '@tanstack/react-query';
import { RequestError } from './errors';

function isRetryable(error: unknown): boolean {
  if (!(error instanceof RequestError)) return false;
  if (error.kind === 'network') return true;
  if (error.kind === 'http' && error.status !== undefined && error.status >= 500) return true;
  return false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
    mutations: {
      retry: false,
    },
  },
});
