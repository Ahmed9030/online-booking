'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useAuthStore } from '@/store/auth'

interface OwnerDashboardStats {
  today_bookings: number
  month_bookings: number
  no_show_rate: number
  subscription: {
    status: string
    days_remaining: number
  }
}

interface StaffDashboardStats {
  today_bookings: number
  month_bookings: number
  no_show_rate: number
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

function DashboardIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    today: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    month: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    noshow: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    subscription: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  }
  return icons[name] || <span className="w-4 h-4" />
}

export default function DashboardPage() {
  const t = useTranslations()
  const isOwner = useAuthStore((s) => s.isOwner())

  const dashboardEndpoint = isOwner ? '/owner/dashboard' : '/staff/dashboard'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', { role: isOwner ? 'owner' : 'staff' }],
    queryFn: async () => {
      const response = await api.get<{ data: OwnerDashboardStats | StaffDashboardStats }>(dashboardEndpoint)
      return response.data.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          {t('nav.dashboard')}
        </h1>
        <span className="text-xs text-text-muted">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            {isOwner && <SkeletonCard />}
          </>
        ) : (
          <>
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-secondary font-medium tracking-wide">حجوزات اليوم</span>
                <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <DashboardIcon name="today" />
                </span>
              </div>
              <div className="text-3xl font-bold text-text-primary font-heading">
                {(stats as OwnerDashboardStats)?.today_bookings ?? (stats as StaffDashboardStats)?.today_bookings ?? '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">{t('common.today')}</div>
            </div>

            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-secondary font-medium tracking-wide">هذا الشهر</span>
                <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <DashboardIcon name="month" />
                </span>
              </div>
              <div className="text-3xl font-bold text-text-primary font-heading">
                {(stats as OwnerDashboardStats)?.month_bookings ?? (stats as StaffDashboardStats)?.month_bookings ?? '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">إجمالي الحجوزات</div>
            </div>

            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-secondary font-medium tracking-wide">معدل عدم الحضور</span>
                <span className="w-9 h-9 rounded-lg bg-cancelled/10 flex items-center justify-center text-cancelled">
                  <DashboardIcon name="noshow" />
                </span>
              </div>
              <div className="text-3xl font-bold text-cancelled font-heading">
                {(stats as OwnerDashboardStats)?.no_show_rate != null ? `${(stats as OwnerDashboardStats).no_show_rate}%` : (stats as StaffDashboardStats)?.no_show_rate != null ? `${(stats as StaffDashboardStats).no_show_rate}%` : '—'}
              </div>
              <div className="text-xs text-text-muted mt-1">نسبة الغياب</div>
            </div>

            {isOwner && (
              <div className="neu-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-text-secondary font-medium tracking-wide">الاشتراك</span>
                  <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <DashboardIcon name="subscription" />
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary font-heading">
                  {(stats as OwnerDashboardStats)?.subscription?.days_remaining ?? '—'}
                </div>
                <div className="text-xs text-text-muted mt-1">أيام متبقية</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/dashboard/calendar">
          <Button variant="primary" className="w-full h-12 text-base">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {t('nav.calendar')}
          </Button>
        </Link>
        <Link href="/dashboard/bookings">
          <Button variant="primary" className="w-full h-12 text-base">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {t('nav.bookings')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
