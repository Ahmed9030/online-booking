'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { PaginatedResponse, Subscription } from '@/types'

/** Parameters for filtering the admin subscriptions list. */
interface UseAdminSubscriptionsParams {
  /** Page number for pagination. */
  page?: number
  /** Filter by subscription status (trial | active | expired | suspended). */
  subscription_status?: string
  /** Search query matched against business name and slug. */
  search?: string
}

/**
 * Fetches a paginated list of all platform subscriptions for the admin panel.
 *
 * Each subscription entry corresponds to a business with its subscription
 * status, expiry date, owner info, and aggregate counts.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack UseQueryResult containing paginated Subscription data.
 */
export function useAdminSubscriptions(params?: UseAdminSubscriptionsParams) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Subscription>>(
        '/admin/subscriptions',
        { params },
      )
      return response.data
    },
  })
}
