'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from '@/i18n/routing'

export default function CustomerLayout({ children }: { children: ReactNode }) {
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
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  )
}
