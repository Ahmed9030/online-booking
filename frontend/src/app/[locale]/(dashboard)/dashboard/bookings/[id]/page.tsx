'use client'

import { use } from 'react'
import { useBookingDetail, useUpdateBookingStatus } from '@/features/bookings/hooks/useDashboardBookings'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'

/** Props for the booking detail page route. */
interface BookingDetailPageProps {
  params: Promise<{
    /** The UUID of the booking to display */
    id: string
  }>
}

/**
 * Booking detail page showing customer info, booking details,
 * and status management actions (complete, no-show, cancel).
 */
export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params)
  const t = useTranslations()
  const { data: booking, isLoading } = useBookingDetail(id)
  const updateStatus = useUpdateBookingStatus()

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!booking) return <div>{t('common.not_found')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        {t('common.booking')} #{booking.id.slice(0, 8)}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('common.customer')}</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-text-secondary">{t('common.name')}:</span>
                <div className="font-medium">{booking.customer?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">{t('common.phone')}:</span>
                <div className="font-medium">{booking.customer?.phone}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.visits')}:
                </span>
                <div className="font-medium">{booking.customer?.visit_count}</div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {t('common.details')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.service')}:
                </span>
                <div className="font-medium">{booking.service?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.staff')}:
                </span>
                <div className="font-medium">{booking.staff?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.starts_at')}:
                </span>
                <div className="font-medium">
                  {new Date(booking.starts_at).toLocaleString('ar-EG')}
                </div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.ends_at')}:
                </span>
                <div className="font-medium">
                  {new Date(booking.ends_at).toLocaleString('ar-EG')}
                </div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.branch')}:
                </span>
                <div className="font-medium">{booking.branch?.name}</div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-text-muted">
                <span className="text-sm text-text-secondary">
                  {t('common.notes')}:
                </span>
                <div className="mt-2 text-text-secondary">{booking.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.status')}</h2>
          <BookingStatusBadge status={booking.status} />

          <div className="mt-6 space-y-2">
            {booking.status === 'confirmed' && (
              <>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() =>
                    updateStatus.mutate({ id: booking.id, status: 'completed' })
                  }
                  disabled={updateStatus.isPending}
                >
                  {t('status.completed')}
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    updateStatus.mutate({ id: booking.id, status: 'no_show' })
                  }
                  disabled={updateStatus.isPending}
                >
                  {t('status.no_show')}
                </Button>
              </>
            )}
            {booking.status !== 'cancelled' && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() =>
                  updateStatus.mutate({ id: booking.id, status: 'cancelled' })
                }
                disabled={updateStatus.isPending}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
