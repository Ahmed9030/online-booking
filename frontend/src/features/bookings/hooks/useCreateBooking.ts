'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CreateBookingRequest, Booking, ApiResponse } from '@/types'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for creating a public booking via the API.
 * Displays a success toast on completion or an error toast on failure.
 *
 * @returns A TanStack mutation object for triggering the booking creation.
 */
export function useCreateBooking() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const response = await api.post<ApiResponse<Booking>>(
        '/public/bookings',
        data,
      )
      return response.data.data
    },
    onSuccess: (booking) => {
      showToast(`تم الحجز بنجاح! الحجز: ${booking.id}`, 'success')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'فشل إنشاء الحجز'
      showToast(message, 'error')
    },
  })
}
