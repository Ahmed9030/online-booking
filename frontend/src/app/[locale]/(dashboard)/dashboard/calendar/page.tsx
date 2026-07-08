'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useDashboardBookings, useUpdateBookingStatus } from '@/features/bookings/hooks/useDashboardBookings'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import { Booking, PaginatedResponse } from '@/types'
import { useAuthStore } from '@/store/auth'
import { useResolvedLocale } from '@/lib/useResolvedLocale'

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#059669',
  completed: '#2563eb',
  no_show: '#9ca3af',
  cancelled: '#dc2626',
  pending: '#b8862a',
}

function formatTime(iso: string, locale = 'ar'): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function BookingModal({
  booking,
  onClose,
}: {
  booking: Booking
  onClose: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useResolvedLocale()
  const updateStatus = useUpdateBookingStatus()

  const handleCancel = () => {
    updateStatus.mutate(
      { id: booking.id, status: 'cancelled' },
      { onSuccess: () => onClose() },
    )
  }

  const handleEdit = () => {
    router.push(`/dashboard/bookings/${booking.id}`)
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div className="space-y-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary font-heading">
            {t('booking.booking_details')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="detail-label">{t('common.customer')}</span>
            <div className="detail-value mt-0.5">{booking.customer?.name || '—'}</div>
            {booking.customer?.phone && (
              <div className="text-xs text-text-secondary mt-0.5" dir="ltr">
                {booking.customer.phone}
              </div>
            )}
          </div>
          <div>
            <span className="detail-label">{t('common.service')}</span>
            <div className="detail-value mt-0.5">{booking.service?.name || '—'}</div>
          </div>
          <div>
            <span className="detail-label">{t('common.staff')}</span>
            <div className="detail-value mt-0.5">{booking.staff?.name || '—'}</div>
          </div>
          <div>
            <span className="detail-label">{t('common.branch')}</span>
            <div className="detail-value mt-0.5">{booking.branch?.name || '—'}</div>
          </div>
          <div className="col-span-2">
            <span className="detail-label">{t('common.status')}</span>
            <div className="mt-1">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
          <div>
            <span className="detail-label">{t('common.starts_at')}</span>
            <div className="detail-value mt-0.5">{formatTime(booking.starts_at, locale)}</div>
          </div>
          <div>
            <span className="detail-label">{t('common.ends_at')}</span>
            <div className="detail-value mt-0.5">{formatTime(booking.ends_at, locale)}</div>
          </div>
        </div>

        {booking.notes && (
          <div className="pt-3 border-t border-border">
            <span className="detail-label">{t('common.notes')}</span>
            <div className="text-sm text-text-secondary mt-1">{booking.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={handleEdit}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleCancel}
            disabled={booking.status === 'cancelled' || updateStatus.isPending}
          >
            {booking.status === 'cancelled' ? t('common.cancelled') : t('common.cancel_booking')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CurrentSessionCard({ bookings, locale }: { bookings: Booking[]; locale: string }) {
  const t = useTranslations()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const current = useMemo(
    () =>
      bookings.find((b) => {
        const start = new Date(b.starts_at)
        const end = new Date(b.ends_at)
        return start <= now && end >= now
      }),
    [bookings, now],
  )

  if (!current) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">{t('calendar.no_current_sessions')}</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-2.5 h-2.5 rounded-full bg-confirmed mt-1.5 shrink-0 animate-pulse" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">
          {current.customer?.name}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {current.service?.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {current.staff?.name}
        </p>
        <p className="text-xs text-text-muted mt-1 font-medium">
          {formatTime(current.starts_at, locale)} — {formatTime(current.ends_at, locale)}
        </p>
      </div>
    </div>
  )
}

function NextBookingCard({ bookings, locale }: { bookings: Booking[]; locale: string }) {
  const t = useTranslations()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const next = useMemo(
    () =>
      bookings
        .filter((b) => new Date(b.starts_at) > now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0],
    [bookings, now],
  )

  if (!next) {
    return (
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">{t('calendar.no_upcoming_bookings')}</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">
          {next.customer?.name}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {next.service?.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {next.staff?.name}
        </p>
        <p className="text-xs text-text-muted mt-1 font-medium">
          {formatTime(next.starts_at, locale)} — {formatTime(next.ends_at, locale)}
        </p>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const t = useTranslations()
  const locale = useResolvedLocale()
  const isStaff = useAuthStore((s) => s.isStaff())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null)

  const ownerBookings = useDashboardBookings()
  const staffScheduleQuery = useQuery({
    queryKey: ['staff-schedule', dateRange],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (dateRange?.from) params.date_from = dateRange.from
      if (dateRange?.to) params.date_to = dateRange.to
      const response = await api.get<{ data: Booking[] }>('/staff/schedule', { params })
      return { data: response.data.data, meta: { current_page: 1, last_page: 1, per_page: 999, total: response.data.data.length } } as PaginatedResponse<Booking>
    },
    enabled: isStaff && !!dateRange,
  })

  const bookingsData = isStaff ? staffScheduleQuery.data : ownerBookings.data
  const isLoading = isStaff ? staffScheduleQuery.isLoading : ownerBookings.isLoading

  const events = (bookingsData?.data || []).map((booking) => ({
    id: booking.id,
    title: `${booking.customer?.name} - ${booking.service?.name}`,
    start: booking.starts_at,
    end: booking.ends_at,
    backgroundColor: STATUS_COLORS[booking.status] || STATUS_COLORS.pending,
    borderColor: STATUS_COLORS[booking.status] || STATUS_COLORS.pending,
    textColor: '#ffffff',
    extendedProps: {
      booking,
    },
  }))

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      setSelectedBooking(info.event.extendedProps.booking)
    },
    [],
  )

  const handleDatesSet = useCallback((range: { start: Date; end: Date }) => {
    setDateRange({
      from: range.start.toISOString().split('T')[0],
      to: range.end.toISOString().split('T')[0],
    })
  }, [])

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary font-heading">
        {t('nav.calendar')}
      </h1>

      <div className="flex flex-col lg:flex-row-reverse gap-6 w-full items-start justify-between">
        {/* Calendar Grid — expands to fill space */}
        <div className="w-full lg:w-[73%] bg-white p-4 rounded-xl shadow-sm overflow-x-auto">
          <div className="min-w-[700px]">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                resourceTimeGridPlugin,
                interactionPlugin,
              ]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
              locale={locale}
              direction={locale === 'ar' ? 'rtl' : 'ltr'}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              nowIndicator={true}
            />
          </div>
        </div>

        {/* Live Salon Monitor — fixed proportion sidebar */}
        <div className="w-full lg:w-[25%] lg:sticky lg:top-4">
          <div className="neu-card p-4">
            <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              {t('calendar.live_monitor')}
            </h2>

            {/* Current Session */}
            <div className="rounded-xl bg-surface-alt/50 p-3 mb-3">
              <h3 className="text-xs font-semibold text-confirmed mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-confirmed animate-pulse" />
                {t('calendar.current_now')}
              </h3>
              <CurrentSessionCard bookings={bookingsData?.data || []} locale={locale} />
            </div>

            {/* Next Booking */}
            <div className="rounded-xl bg-surface-alt/50 p-3">
              <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t('calendar.next_booking')}
              </h3>
              <NextBookingCard bookings={bookingsData?.data || []} locale={locale} />
            </div>
          </div>
        </div>
      </div>

      {/* Central Booking Detail Modal */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
