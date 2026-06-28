'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { User } from '@/types'

/**
 * Options for configuring the protected route hook.
 */
interface UseProtectedRouteOptions {
  /** Required role to access the route */
  requiredRole?: User['role']
}

/**
 * Custom hook that protects a route by checking authentication status and
 * optionally a required user role. Redirects to the login page if the user
 * is not authenticated, or to the dashboard if the user lacks the required role.
 *
 * @param options - Configuration options including an optional required role.
 * @returns An object with isAuthenticated flag and current user.
 */
export function useProtectedRoute(options?: UseProtectedRouteOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!token) {
      router.push('/ar/auth/login')
      return
    }

    if (options?.requiredRole && user?.role !== options.requiredRole) {
      router.push('/ar/dashboard')
      return
    }
  }, [token, user, router, pathname, options?.requiredRole])

  return { isAuthenticated: !!token, user }
}
