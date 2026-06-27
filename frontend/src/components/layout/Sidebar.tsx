'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/dashboard/calendar', key: 'calendar' },
  { href: '/dashboard/bookings', key: 'bookings' },
  { href: '/dashboard/customers', key: 'customers' },
  { href: '/dashboard/staff', key: 'staff' },
  { href: '/dashboard/services', key: 'services' },
  { href: '/dashboard/branches', key: 'branches' },
  { href: '/dashboard/settings', key: 'settings' },
] as const

export function Sidebar() {
  const t = useTranslations()
  const token = useAuthStore((s) => s.token)
  const isOwner = useAuthStore((s) => s.isOwner())
  const isStaff = useAuthStore((s) => s.isStaff())
  const isOpen = useUiStore((s) => s.isSidebarOpen)

  if (!token || (!isOwner && !isStaff)) return null

  return (
    <aside
      className={cn(
        'h-screen bg-surface flex flex-col transition-all duration-200 border-l border-border',
        isOpen ? 'w-60' : 'w-0 -mr-60 overflow-hidden md:w-16 md:mr-0',
      )}
    >
      <div className="p-4 border-b border-border flex items-center gap-3 min-h-14">
        <div className="w-8 h-8 rounded-xl neu-btn flex items-center justify-center text-xs font-bold text-primary shrink-0">
          B
        </div>
        {isOpen && (
          <h2 className="text-sm font-bold text-text-primary truncate">
            {t('nav.dashboard')}
          </h2>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all',
              !isOpen && 'justify-center px-2',
            )}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">
              <NavIcon name={key} />
            </span>
            {isOpen && <span className="truncate">{t(`nav.${key}`)}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    dashboard: '▦',
    calendar: '📅',
    bookings: '📋',
    customers: '👥',
    staff: '👤',
    services: '⚙',
    branches: '🏪',
    settings: '⚡',
  }
  return <>{icons[name] || '•'}</>
}
