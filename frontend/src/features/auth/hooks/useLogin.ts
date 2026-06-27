'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { AuthResponse } from '@/types'
import { LoginFormData } from '@/lib/validations'
import { useRouter } from '@/i18n/routing'
import { useUiStore } from '@/store/ui'

export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      setUser(data.data.user)
      setToken(data.data.token)
      showToast('تم تسجيل الدخول بنجاح', 'success')

      const role = data.data.user.role
      if (role === 'owner' || role === 'staff') {
        router.push('/dashboard')
      } else {
        router.push('/my-bookings')
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || 'فشل تسجيل الدخول'
      showToast(message, 'error')
    },
  })
}
