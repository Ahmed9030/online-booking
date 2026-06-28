'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { Button } from '@/components/ui/button'

/**
 * Dashboard top bar component displaying the current user's name,
 * role, and logout button. Includes a mobile hamburger menu toggle.
 * Uses the useLogout hook for proper API call and state cleanup.
 */
export function TopBar() {
  const t = useTranslations()
  const user = useAuthStore((s) => s.user)
  const business = useAuthStore((s) => s.business)
  const logout = useLogout()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  if (!user) return null

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </Button>
        <h1 className="text-base font-semibold text-text-primary hidden md:block">
          {business?.name || t('nav.dashboard')}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-left">
          <div className="text-sm font-semibold text-text-primary">{user.name}</div>
          <div className="text-xs text-text-secondary">{t(`role.${user.role}`)}</div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {t('auth.logout')}
        </Button>
      </div>
    </header>
  )
}
