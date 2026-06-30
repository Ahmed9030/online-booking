'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AdminAnalytics } from '@/types'

/**
 * Fetches platform-wide analytics data for the admin reporting view.
 *
 * Returns aggregated revenue, user growth, booking statistics, and
 * business subscription breakdowns for the requested time range.
 *
 * @param months - Number of months of historical data to include (default 12, max 36).
 * @returns A TanStack UseQueryResult containing the AdminAnalytics data.
 */
export function useAdminAnalytics(months?: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', { months }],
    queryFn: async () => {
      const response = await api.get<{ data: AdminAnalytics }>(
        '/admin/analytics',
        { params: { months } },
      )
      return response.data.data
    },
  })
}
