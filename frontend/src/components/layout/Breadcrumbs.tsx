'use client'

import { usePathname, Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

interface Segment {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  /** Custom segments override auto-detection from URL (for dynamic routes like detail pages) */
  segments?: Segment[]
  /** Explicit back button href. Defaults to parent directory. */
  backHref?: string
  /** Hide back button */
  hideBack?: boolean
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMBER_REGEX = /^\d+$/

const LABEL_MAP: Record<string, string> = {
  calendar: 'nav.calendar',
  bookings: 'nav.bookings',
  customers: 'nav.customers',
  staff: 'nav.staff',
  services: 'nav.services',
  branches: 'nav.branches',
  settings: 'nav.settings',
  create: 'common.create',
  overview: 'admin.overview',
  businesses: 'admin.businesses',
  subscriptions: 'admin.subscriptions',
  users: 'admin.users',
  analytics: 'admin.analytics',
}

function isUuid(part: string) {
  return UUID_REGEX.test(part) || NUMBER_REGEX.test(part)
}

function resolveLabel(part: string, t: (key: string) => string): string {
  const key = LABEL_MAP[part]
  if (key) return t(key)
  if (isUuid(part)) return t('common.details')
  return decodeURIComponent(part)
}

function buildSegments(pathname: string, t: (key: string) => string): Segment[] {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) return []

  const isDashboard = parts[0] === 'dashboard'
  const isAdmin = parts[0] === 'admin'

  if (!isDashboard && !isAdmin) return []

  const base = isDashboard ? 'dashboard' : 'admin'
  const routeParts = parts.slice(1)

  const homeLabel = isDashboard ? t('nav.dashboard') : t('admin.panel')
  const homeHref = isDashboard ? '/dashboard' : '/admin/overview'

  const segments: Segment[] = [
    { label: homeLabel, href: homeHref },
  ]

  if (routeParts.length === 0) return segments

  for (let i = 0; i < routeParts.length; i++) {
    const part = routeParts[i]
    const isLast = i === routeParts.length - 1
    const isDynamic = isUuid(part)

    const href = isLast || isDynamic ? undefined : `/${base}/${routeParts.slice(0, i + 1).join('/')}`

    segments.push({
      label: resolveLabel(part, t),
      href,
    })
  }

  return segments
}

function getParentHref(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length <= 1) return undefined

  const isDashboard = parts[0] === 'dashboard'
  const isAdmin = parts[0] === 'admin'
  if (!isDashboard && !isAdmin) return undefined

  const root = isDashboard ? '/dashboard' : '/admin/overview'
  if (parts.length <= 2) return root
  return `/${parts.slice(0, -1).join('/')}`
}

export function Breadcrumbs({ segments: customSegments, backHref, hideBack }: BreadcrumbsProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const autoSegments = buildSegments(pathname, t)
  const segments = customSegments ?? autoSegments
  if (segments.length === 0) return null

  const parentHref = backHref ?? getParentHref(pathname)

  return (
    <div className="mb-6">
      <nav className="flex items-center gap-1 text-sm text-gray-400" aria-label="Breadcrumb">
        {parentHref && !hideBack && (
          <Link
            href={parentHref}
            className="inline-flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-xs">{t('common.back')}</span>
          </Link>
        )}

        {parentHref && !hideBack && segments.length > 0 && (
          <span className="text-gray-300 select-none">|</span>
        )}

        {segments.map((segment, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
            {segment.href ? (
              <Link
                href={segment.href}
                className="hover:text-gray-700 transition-colors truncate max-w-[160px]"
              >
                {segment.label}
              </Link>
            ) : (
              <span className="text-gray-700 font-semibold truncate max-w-[200px]">
                {segment.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </div>
  )
}
