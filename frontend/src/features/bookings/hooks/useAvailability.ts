'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AvailabilitySlot } from '@/types'

interface CheckAvailabilityRequest {
  branch_id: string
  service_id: string
  staff_id?: string | null
  date: string
}

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
