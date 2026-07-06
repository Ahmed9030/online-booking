'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

const ownerOnlyPaths = ['/customers', '/staff', '/services', '/branches', '/bookings/create']

function isOwnerOnlyPath(pathname: string): boolean {
  const path = pathname.replace(/^\/[a-z]{2}/, '').replace(/^\/dashboard/, '') // strip locale + dashboard
  return ownerOnlyPaths.some((p) => path === p || path.startsWith(p + '/'))
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isStaff = useAuthStore((s) => s.isStaff())

  useEffect(() => {
    if (!isHydrated) return

    const locale = pathname.split('/')[1] || 'ar'
    if (!token) {
      router.push(`/${locale}/login`)
      return
    }

    if (user && user.role !== 'owner' && user.role !== 'staff') {
      const roleRoutes: Record<string, string> = {
        admin: '/admin/overview',
        customer: '/my-bookings',
      }
      router.push(`/${locale}${roleRoutes[user.role] || '/'}`)
      return
    }

    if (isStaff && isOwnerOnlyPath(pathname)) {
      router.push(`/${locale}/dashboard`)
    }
  }, [token, user, router, pathname, isStaff, isHydrated])

  if (!isHydrated || !token || (user && user.role !== 'owner' && user.role !== 'staff')) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
