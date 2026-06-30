'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { AuthResponse } from '@/types'
import { RegisterFormData } from '@/lib/validations'
import { useRouter } from '@/i18n/routing'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for owner registration with automatic business creation.
 * On success, stores the user, business, and token in the auth store
 * and redirects to the dashboard. On error, displays a toast notification.
 *
 * @returns A TanStack mutation object for triggering the registration request.
 */
export function useRegister() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setBusiness = useAuthStore((s) => s.setBusiness)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await api.post<AuthResponse>('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      const user = data.data.user
      const business = data.data.business
      const token = data.data.token

      setUser(user)
      setBusiness(business ?? null)
      setToken(token)

      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_business', JSON.stringify(business))
      localStorage.setItem('auth_token', token)

      showToast('تم إنشاء الحساب بنجاح! مرحباً بك', 'success')

      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message =
        err.response?.data?.message || 'فشل إنشاء الحساب. تحقق من البيانات'
      showToast(message, 'error')
    },
  })
}
