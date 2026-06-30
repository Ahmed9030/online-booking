'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { AuthResponse } from '@/types'
import { LoginFormData } from '@/lib/validations'
import { useRouter } from '@/i18n/routing'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for owner/staff login with password-based authentication.
 * On success, stores the user and token in the auth store and redirects
 * based on the user's role (owner→/dashboard, staff→/staff/schedule,
 * admin→/admin/overview, customer→/my-bookings).
 * On error, displays a toast notification.
 *
 * @returns A TanStack mutation object for triggering the login request.
 */
export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setBusiness = useAuthStore((s) => s.setBusiness)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      const user = data.data.user
      const token = data.data.token

      setUser(user)
      setBusiness(data.data.business ?? null)
      setToken(token)

      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_token', token)
      if (data.data.business) {
        localStorage.setItem('auth_business', JSON.stringify(data.data.business))
      }

      showToast('تم تسجيل الدخول بنجاح', 'success')

      const routes: Record<string, string> = {
        owner: '/dashboard',
        staff: '/staff/schedule',
        admin: '/admin/overview',
        customer: '/my-bookings',
      }

      const redirectUrl = routes[user.role] || '/'
      router.push(redirectUrl)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      const message =
        err.response?.data?.message || 'فشل تسجيل الدخول. حاول مرة أخرى'
      showToast(message, 'error')
    },
  })
}
