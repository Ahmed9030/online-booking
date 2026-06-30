'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { VerifyOtpResponse } from '@/types'

/**
 * Custom hook for sending an OTP code to a customer's phone via WhatsApp.
 * Displays a success or error toast based on the result.
 *
 * @returns A TanStack mutation object for triggering the OTP send.
 */
export function useSendOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (phone: string) => {
      await api.post('/auth/otp/send', { phone })
    },
    onSuccess: () => {
      showToast('تم إرسال رمز التحقق على واتساب', 'success')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err.response?.data?.message || 'فشل إرسال الرمز', 'error')
    },
  })
}

/**
 * Custom hook for verifying an OTP code and obtaining an auth token.
 * On success, stores the token and a minimal customer user object in the
 * auth store and persists to localStorage. Displays an error toast on failure.
 *
 * @returns A TanStack mutation object for triggering the OTP verification.
 */
export function useVerifyOtp() {
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async ({
      phone,
      code,
    }: {
      phone: string
      code: string
    }) => {
      const response = await api.post<{ data: VerifyOtpResponse }>(
        '/auth/otp/verify',
        { phone, code },
      )
      return response.data.data
    },
    onSuccess: (data) => {
      const store = useAuthStore.getState()
      store.setBusiness(null)
      setToken(data.token)

      const customerUser = {
        id: 'temp-customer',
        name: 'Customer',
        phone: data.phone,
        role: 'customer' as const,
      }
      setUser(customerUser)

      showToast('تم التحقق من الرقم بنجاح', 'success')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err.response?.data?.message || 'رمز غير صحيح', 'error')
    },
  })
}
