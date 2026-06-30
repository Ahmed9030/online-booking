'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      const locale = pathname.split('/')[1] || 'ar'
      logout()

      showToast('تم تسجيل الخروج بنجاح', 'success')

      setTimeout(() => {
        router.push(`/${locale}`)
      }, 500)
    },
    onError: () => {
      const locale = pathname.split('/')[1] || 'ar'
      logout()
      router.push(`/${locale}`)
    },
  })
}
