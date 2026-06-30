'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from '@/i18n/routing'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

/**
 * Dashboard layout component providing authenticated access.
 * Checks for a valid auth token, redirecting to login if unauthorized.
 * Renders the Sidebar, TopBar, and main content area.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  if (!token) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
