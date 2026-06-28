'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'

export function TopBar() {
  const t = useTranslations()
  const user = useAuthStore((s) => s.user)
  const business = useAuthStore((s) => s.business)
  const logout = useAuthStore((s) => s.logout)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

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
        <span className="text-sm text-text-secondary hidden sm:block">{user?.name}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          {t('auth.logout')}
        </Button>
      </div>
    </header>
  )
}
