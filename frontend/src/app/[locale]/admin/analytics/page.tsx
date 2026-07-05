'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminAnalytics } from '@/features/admin/hooks/useAdminAnalytics'
import { cn } from '@/lib/utils'

/** A single data point for the MiniBarChart component. */
interface ChartDataPoint {
  /** Month label (e.g. "2026-01"). */
  month: string
  /** The numeric value for this month. */
  value: number
}

/** Props for the MiniBarChart component. */
interface MiniBarChartProps {
  /** Array of data points to render as bars. */
  data: ChartDataPoint[]
  /** Tailwind background colour class for the bars. */
  color?: string
  /** Total height of the chart in pixels. */
  height?: number
}

/**
 * A lightweight CSS-only bar chart for displaying time-series data.
 *
 * Each data point is rendered as a proportional vertical bar. The tallest
 * bar fills the full container height; all others scale relative to it.
 *
 * @param props - The chart configuration.
 * @returns A bar chart ReactNode.
 */
function MiniBarChart({
  data,
  color = 'bg-primary',
  height = 40,
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div
          key={d.month}
          className="flex-1 flex flex-col items-center gap-0.5"
          title={`${d.month}: ${d.value}`}
        >
          <div
            className={cn('w-full rounded-t-sm transition-all', color)}
            style={{
              height: `${(d.value / maxValue) * 100}%`,
              minHeight: d.value > 0 ? '4px' : '0',
            }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Admin analytics & reporting page.
 *
 * Displays platform-wide KPIs (revenue, users, bookings) and visualises
 * trends over time using CSS-only bar charts. The time range can be
 * adjusted via a months selector (6, 12, 24, or 36 months).
 *
 * @returns The analytics page content.
 */
export default function AdminAnalyticsPage() {
  const t = useTranslations()
  const [months, setMonths] = useState(12)
  const { data, isLoading } = useAdminAnalytics(months)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-text-secondary">
        {t('common.loading')}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40 text-text-secondary">
        {t('common.no_results')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {t('admin.analytics')}
        </h1>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="neu-input rounded-xl px-4 py-2 text-sm bg-surface border border-border text-text-primary"
        >
          <option value="6">6 {t('common.months')}</option>
          <option value="12">12 {t('common.months')}</option>
          <option value="24">24 {t('common.months')}</option>
          <option value="36">36 {t('common.months')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('admin.total_revenue')}</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {data.revenue.total.toLocaleString()} {t('admin.egp')}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {t('admin.this_month')}: {data.revenue.this_month.toLocaleString()} {t('admin.egp')}
          </p>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('admin.total_users')}</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {data.users.total}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {t('admin.new_this_month')}: {data.users.this_month}
          </p>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('admin.total_bookings')}</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {data.bookings.total}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neu-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('admin.revenue_over_time')}
          </h3>
          <MiniBarChart
            data={data.revenue.monthly.map((m) => ({ month: m.month, value: m.revenue }))}
            color="bg-green-500"
            height={100}
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            {data.revenue.monthly.filter((_, i) => i % Math.max(1, Math.floor(data.revenue.monthly.length / 6)) === 0).map((m) => (
              <span key={m.month}>{m.month}</span>
            ))}
          </div>
        </div>

        <div className="neu-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('admin.user_growth')}
          </h3>
          <MiniBarChart
            data={data.users.monthly.map((m) => ({ month: m.month, value: m.count }))}
            color="bg-blue-500"
            height={100}
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            {data.users.monthly.filter((_, i) => i % Math.max(1, Math.floor(data.users.monthly.length / 6)) === 0).map((m) => (
              <span key={m.month}>{m.month}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('admin.booking_statistics')}
        </h3>
        <MiniBarChart
          data={data.bookings.monthly.map((m) => ({ month: m.month, value: m.count }))}
          color="bg-purple-500"
          height={80}
        />
        <div className="flex justify-between text-[10px] text-text-secondary">
          {data.bookings.monthly.filter((_, i) => i % Math.max(1, Math.floor(data.bookings.monthly.length / 6)) === 0).map((m) => (
            <span key={m.month}>{m.month}</span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {Object.entries(data.bookings.by_status).map(([status, count]) => (
            <div key={status} className="text-center">
              <span className="block text-lg font-bold text-text-primary">{count}</span>
              <span className="block text-xs text-text-secondary">{t(`status.${status}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('admin.businesses_overview')}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.businesses.by_subscription).map(([status, count]) => (
            <div key={status} className="text-center">
              <span className="block text-lg font-bold text-text-primary">{count}</span>
              <span className="block text-xs text-text-secondary">{t(`admin.${status}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
