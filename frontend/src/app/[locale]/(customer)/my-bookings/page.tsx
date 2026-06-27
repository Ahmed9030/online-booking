'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'

interface CustomerBooking {
  id: string
  status: string
  starts_at: string
  service?: { name: string }
  staff?: { name: string }
  branch?: { name: string }
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-primary/10 text-primary',
  completed: 'bg-accent/10 text-accent',
  cancelled: 'bg-danger/10 text-danger',
  no_show: 'bg-text-muted/10 text-text-muted',
}

const statusLabels: Record<string, string> = {
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
}

function SkeletonBooking() {
  return (
    <div className="neu-card p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-text-muted/20 rounded" />
          <div className="h-3 w-24 bg-text-muted/20 rounded" />
          <div className="h-3 w-40 bg-text-muted/20 rounded" />
        </div>
        <div className="h-6 w-14 bg-text-muted/20 rounded" />
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const t = useTranslations()
  const token = useAuthStore((s) => s.token)

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: async () => {
      const response = await api.get<{ data: CustomerBooking[] }>('/customer/my-bookings')
      return response.data.data
    },
    enabled: !!token,
  })

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        {t('nav.my_bookings')}
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonBooking />
          <SkeletonBooking />
          <SkeletonBooking />
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="neu-card p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-semibold text-text-primary">
                    {booking.service?.name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(booking.starts_at).toLocaleString('ar-EG')}
                  </div>
                  <div className="text-xs text-text-muted">
                    {booking.staff?.name && `${booking.staff?.name} • `}
                    {booking.branch?.name}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${statusColors[booking.status] || 'bg-text-muted/10 text-text-muted'}`}>
                  {statusLabels[booking.status] || booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="neu-card p-10 text-center">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-text-muted">لا توجد حجوزات</p>
        </div>
      )}
    </div>
  )
}
