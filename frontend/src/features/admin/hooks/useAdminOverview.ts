'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AdminOverview } from '@/types'

/**
 * Custom hook that fetches the admin platform overview statistics.
 *
 * Retrieves aggregate counts for businesses (total / active / trial),
 * total customers, and total / monthly bookings across the entire platform.
 *
 * @returns A TanStack UseQueryResult containing the AdminOverview data.
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ data: AdminOverview }>('/admin/overview')
      return response.data.data
    },
  })
}
