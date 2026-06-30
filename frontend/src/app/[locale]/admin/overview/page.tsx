'use client'

import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminOverview } from '@/features/admin/hooks/useAdminOverview'

/** Props for the StatCard component displayed on the admin overview grid. */
interface StatCardProps {
  /** Label displayed above the value. */
  label: string
  /** The primary numeric or text value. */
  value: number | string
  /** Optional secondary text shown below the value. */
  sub?: string
  /** Icon rendered in the top-right corner. */
  icon: ReactNode
  /** Trend direction that determines the sub-text color. */
  trend?: 'up' | 'down' | 'neutral'
}

/**
 * A single statistics card for the admin overview dashboard.
 *
 * Displays a label, a large value, an optional sub-text with trend
 * colouring, and an icon in the top-right corner.
 *
 * @param props - The card properties.
 * @returns A styled card element.
 */
function StatCard({ label, value, sub, icon, trend }: StatCardProps) {
  const trendColors = {
    up: 'text-confirmed',
    down: 'text-cancelled',
    neutral: 'text-text-muted',
  }

  return (
    <div className="neu-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary font-medium tracking-wide">
          {label}
        </span>
        <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </span>
      </div>
      <span className="text-3xl font-bold text-text-primary font-heading">
        {value}
      </span>
      {sub && (
        <span className={`text-xs font-medium ${trend ? trendColors[trend] : 'text-text-muted'}`}>
          {sub}
        </span>
      )}
    </div>
  )
}

/**
 * Resolves a named icon to its inline SVG element for overview stat cards.
 *
 * @param name - The icon identifier (businesses | customers | bookings | active).
 * @returns An SVG ReactNode for the requested icon.
 */
function OverviewIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    businesses: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    customers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    bookings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    active: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  }
  return icons[name] || <span className="w-4 h-4" />
}

/**
 * Admin overview page — displays platform-wide statistics.
 *
 * Renders a grid of stat cards (businesses, customers, bookings, active
 * businesses) by fetching data via the useAdminOverview hook.
 *
 * @returns The admin overview page content.
 */
export default function AdminOverviewPage() {
  const t = useTranslations()
  const { data, isLoading } = useAdminOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-text-secondary">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-2" />
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          {t('admin.overview')}
        </h1>
        <span className="text-xs text-text-muted">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('admin.total_businesses')}
          value={data?.businesses.total ?? 0}
          sub={`${t('admin.active')}: ${data?.businesses.active ?? 0} | ${t('admin.trial')}: ${data?.businesses.trial ?? 0}`}
          icon={<OverviewIcon name="businesses" />}
          trend="up"
        />
        <StatCard
          label={t('admin.total_customers')}
          value={data?.customers ?? 0}
          icon={<OverviewIcon name="customers" />}
          trend="neutral"
        />
        <StatCard
          label={t('admin.total_bookings')}
          value={data?.bookings_total ?? 0}
          sub={`${t('admin.this_month')}: ${data?.bookings_month ?? 0}`}
          icon={<OverviewIcon name="bookings" />}
          trend="up"
        />
        <StatCard
          label={t('admin.active_businesses')}
          value={data?.businesses.active ?? 0}
          icon={<OverviewIcon name="active" />}
          trend="up"
        />
      </div>
    </div>
  )
}
