'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CreateBookingRequest, Booking, ApiResponse } from '@/types'
import { useUiStore } from '@/store/ui'

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
