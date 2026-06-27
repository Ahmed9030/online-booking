'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useSendOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (phone: string) => {
      await api.post('/auth/otp/send', { phone })
    },
    onSuccess: () => {
      showToast('تم إرسال الكود على واتساب', 'success')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err.response?.data?.message || 'فشل إرسال الكود', 'error')
    },
  })
}

export function useVerifyOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const response = await api.post('/auth/otp/verify', { phone, code })
      return response.data
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err.response?.data?.message || 'كود غير صحيح', 'error')
    },
  })
}
