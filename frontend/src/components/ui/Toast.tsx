'use client'

import { useEffect } from 'react'
import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils'

export function Toast() {
  const message = useUiStore((s) => s.toastMessage)
  const type = useUiStore((s) => s.toastType)
  const clearToast = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearToast, 4000)
      return () => clearTimeout(timer)
    }
  }, [message, clearToast])

  if (!message) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={cn(
          'px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm',
          type === 'success' && 'bg-green-600/90 text-white',
          type === 'error' && 'bg-red-600/90 text-white',
          type === 'info' && 'bg-surface/90 text-text-primary border border-border',
        )}
      >
        {message}
      </div>
    </div>
  )
}
