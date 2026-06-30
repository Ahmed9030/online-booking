'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AvailabilitySlot } from '@/types'

/** Parameters for checking available booking slots. */
interface CheckAvailabilityRequest {
  /** The UUID of the branch */
  branch_id: string
  /** The UUID of the service */
  service_id: string
  /** Optional staff UUID to filter by (null for any available) */
  staff_id?: string | null
  /** The date to check availability for (YYYY-MM-DD) */
  date: string
}

/**
 * Custom hook for checking available booking time slots.
 * Automatically enabled when params are provided.
 *
 * @param params - The branch, service, optional staff, and date to check availability for.
 * @returns A TanStack query result containing an array of available slots.
 */
export function useAvailability(params?: CheckAvailabilityRequest) {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: async () => {
      if (!params) return null

      const response = await api.post<{
        data: { slots: AvailabilitySlot[] }
      }>('/public/availability/check', params)

      return response.data.data.slots
    },
    enabled: !!params,
  })
}
