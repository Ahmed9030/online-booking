import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client configured with sensible defaults for the dashboard:
 * - 5-minute stale time to reduce redundant fetches
 * - 10-minute garbage collection for cached data
 * - Single retry for failed queries and mutations
 * - Window refocus refetching disabled
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
