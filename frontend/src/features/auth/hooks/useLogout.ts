'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for logging out the current user.
 * Calls the logout API endpoint, clears all auth state from the store and
 * localStorage, shows a success toast, and redirects to the home page.
 * On API failure, performs a force logout regardless.
 *
 * @returns A TanStack mutation object for triggering the logout request.
 */
export function useLogout() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      logout()

      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_business')

      showToast('تم تسجيل الخروج بنجاح', 'success')

      setTimeout(() => {
        router.push('/ar')
      }, 500)
    },
    onError: () => {
      logout()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_business')
      router.push('/ar')
    },
  })
}
