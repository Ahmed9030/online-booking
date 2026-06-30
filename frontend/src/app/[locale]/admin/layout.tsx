'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from '@/i18n/routing'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      router.push('/login')
    }
  }, [token, user, router])

  if (!token || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  )
}
