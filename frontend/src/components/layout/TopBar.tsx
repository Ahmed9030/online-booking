'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const t = useTranslations()
  const user = useAuthStore((s) => s.user)
  const business = useAuthStore((s) => s.business)
  const logout = useLogout()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  if (!user) return null

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </Button>
        <h1 className="text-base font-semibold text-text-primary hidden md:block">
          {business?.name || t('nav.dashboard')}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="text-left">
          <div className="text-sm font-semibold text-text-primary">{user.name}</div>
          <div className="text-xs text-text-muted">{t(`role.${user.role}`)}</div>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          title={t('auth.logout')}
          aria-label={t('auth.logout')}
        >
          {logout.isPending ? (
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
