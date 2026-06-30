'use client'

import { useEffect, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Props for the Modal component. */
interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Optional CSS class name */
  className?: string
}

/**
 * Modal overlay component with backdrop click-to-dismiss and ESC key support.
 * Renders children centered on screen with neumorphism styling.
 *
 * @param props - Component props including visibility state, close handler, and children.
 * @returns The modal JSX or null when closed.
 */
export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg mx-4 neu-card p-6 max-h-[90vh] overflow-y-auto',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
