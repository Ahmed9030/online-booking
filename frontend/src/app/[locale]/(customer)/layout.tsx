'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!isHydrated) return

    const locale = pathname.split('/')[1] || 'ar'
    if (!token) {
      router.push(`/${locale}/login`)
      return
    }

    if (user?.role && user.role !== 'customer') {
      const roleRoutes: Record<string, string> = {
        owner: '/dashboard',
        staff: '/dashboard',
        admin: '/admin/overview',
      }
      router.push(`/${locale}${roleRoutes[user.role] || '/'}`)
    }
  }, [token, user, router, pathname, isHydrated])

  if (!isHydrated || !token || (user?.role && user.role !== 'customer')) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  )
}
