'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

interface DashboardStats {
  today_bookings: number
  month_bookings: number
  no_show_rate: number
  subscription: {
    status: string
    days_remaining: number
  }
}

function SkeletonCard() {
  return (
    <div className="neu-card p-6 animate-pulse">
      <div className="h-3 w-16 bg-text-muted/20 rounded mb-3" />
      <div className="h-8 w-12 bg-text-muted/20 rounded" />
      <div className="h-3 w-20 bg-text-muted/20 rounded mt-3" />
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardStats }>('/owner/dashboard')
      return response.data.data
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('nav.dashboard')}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">{t('common.today')}</span>
                <span className="text-xl">📅</span>
              </div>
              <div className="text-3xl font-bold text-text-primary">
                {stats?.today_bookings ?? '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">حجوزات اليوم</div>
            </div>

            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">هذا الشهر</span>
                <span className="text-xl">📊</span>
              </div>
              <div className="text-3xl font-bold text-text-primary">
                {stats?.month_bookings ?? '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">إجمالي الحجوزات</div>
            </div>

            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">معدل عدم الحضور</span>
                <span className="text-xl">⚠️</span>
              </div>
              <div className="text-3xl font-bold text-danger">
                {stats?.no_show_rate != null ? `${stats.no_show_rate}%` : '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">نسبة الغياب</div>
            </div>

            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">الاشتراك</span>
                <span className="text-xl">🏪</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {stats?.subscription.days_remaining ?? '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">أيام متبقية</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/dashboard/calendar">
          <Button variant="primary" className="w-full h-12 text-base">
            📅 {t('nav.calendar')}
          </Button>
        </Link>
        <Link href="/dashboard/bookings">
          <Button variant="primary" className="w-full h-12 text-base">
            📋 {t('nav.bookings')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
