'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { useRouter, Link } from '@/i18n/routing'
import { usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { useAdminOverview } from '@/features/admin/hooks/useAdminOverview'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

/** Navigation item descriptor for the admin sidebar. */
interface NavItem {
  /** Route href path. */
  href: string
  /** i18n translation key under the "admin" namespace. */
  key: string
}

/** Sidebar navigation items mapped to their i18n keys. */
const adminNavItems: NavItem[] = [
  { href: '/admin/overview', key: 'overview' },
  { href: '/admin/businesses', key: 'businesses' },
  { href: '/admin/subscriptions', key: 'subscriptions' },
  { href: '/admin/users', key: 'users' },
  { href: '/admin/analytics', key: 'analytics' },
]

/**
 * Resolves an icon name to its inline SVG element for sidebar navigation.
 *
 * @param name - The icon identifier matching a nav item key.
 * @returns An SVG ReactNode for the requested icon.
 */
function AdminIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    overview: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
    businesses: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    subscriptions: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    users: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    analytics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  }
  return icons[name] || <span className="w-4 h-4" />
}

/**
 * Admin panel layout with collapsible sidebar and top navigation bar.
 *
 * Wraps all admin pages with:
 * - A fixed sidebar containing navigation links, a dashboard return link,
 *   and a branding header.
 * - A sticky top bar with sidebar toggle, user name, and logout button.
 * - A main content area with breadcrumbs and the active page.
 *
 * Route protection: redirects to /login if the user is not authenticated
 * or does not have the admin role.
 *
 * @param children - The active admin page content.
 * @returns The admin layout wrapper.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isOpen = useUiStore((s) => s.isSidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const logout = useLogout()

  /** Prefetch overview data so the first page load is instant. */
  useAdminOverview()

  useEffect(() => {
    if (!isHydrated) return
    if (!token || user?.role !== 'admin') {
      router.push('/login')
    }
  }, [token, user, router, isHydrated])

  if (!isHydrated || !token || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <aside
        className={cn(
          'h-screen flex flex-col transition-all duration-200 bg-white shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)] fixed right-0 top-0 z-40',
          isOpen ? 'w-60' : 'w-0 -mr-60 overflow-hidden md:w-16 md:mr-0',
        )}
      >
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 min-h-14">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            A
          </div>
          {isOpen && (
            <h2 className="text-sm font-bold text-text-primary truncate">
              {t('admin.panel')}
            </h2>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {adminNavItems.map(({ href, key }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  !isOpen && 'justify-center px-2',
                  isActive
                    ? 'bg-primary/[0.12] text-primary font-semibold border-r-2 border-primary'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                )}
              >
                <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <AdminIcon name={key} />
                </span>
                {isOpen && <span className="truncate">{t(`admin.${key}`)}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-gray-200">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              !isOpen && 'justify-center px-2',
              'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
            )}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {isOpen && <span className="truncate">{t('admin.back_to_dashboard')}</span>}
          </Link>
        </div>
      </aside>

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200',
          isOpen ? 'mr-60' : 'mr-0 md:mr-16',
        )}
      >
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex-1" />

          <span className="text-sm text-text-secondary font-medium">
            {user?.name}
          </span>

          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
            title={t('auth.logout')}
          >
            {logout.isPending ? (
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  )
}
