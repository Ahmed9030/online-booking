'use client'

import { useState } from 'react'
import { useDashboardBookings, useUpdateBookingStatus, useDeleteBooking } from '@/features/bookings/hooks/useDashboardBookings'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import { useAuthStore } from '@/store/auth'

/**
 * Bookings management page with a filterable, paginated table.
 * Supports filtering by status, performing status updates (complete, no-show),
 * and deleting bookings. Includes a create booking button.
 */
export default function BookingsPage() {
  const t = useTranslations()
  const isOwner = useAuthStore((s) => s.isOwner())
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: bookingsData, isLoading } = useDashboardBookings({
    page,
    status: statusFilter || undefined,
  })

  const updateStatus = useUpdateBookingStatus()
  const deleteBooking = useDeleteBooking()

  /**
   * Triggers a booking status update mutation.
   *
   * @param id - The UUID of the booking to update.
   * @param status - The new status to apply.
   */
  const handleStatusChange = (id: string, status: 'completed' | 'no_show' | 'cancelled') => {
    updateStatus.mutate({ id, status })
  }

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.bookings')}</h1>
        {isOwner && (
          <Link href="/dashboard/bookings/create">
            <Button variant="primary">{t('common.create')}</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="neu-card flex gap-2 flex-wrap p-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`neu-btn px-4 py-2 ${
            !statusFilter ? 'neu-slot-selected' : ''
          }`}
        >
          {t('common.all')}
        </button>
        {['confirmed', 'completed', 'no_show', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`neu-btn px-4 py-2 ${
              statusFilter === status ? 'neu-slot-selected' : ''
            }`}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="neu-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-text-muted">
            <tr>
              <th className="text-right p-4 font-semibold">{t('common.customer')}</th>
              <th className="text-right p-4 font-semibold">{t('common.service')}</th>
              <th className="text-right p-4 font-semibold">{t('common.time')}</th>
              <th className="text-right p-4 font-semibold">{t('common.status')}</th>
              <th className="text-right p-4 font-semibold">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookingsData?.data.map((booking) => (
              <tr key={booking.id} className="border-b border-text-muted hover:bg-surface-alt">
                <td className="p-4">{booking.customer?.name}</td>
                <td className="p-4">{booking.service?.name}</td>
                <td className="p-4">
                  {new Date(booking.starts_at).toLocaleString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="p-4 space-x-2">
                  <Link href={`/dashboard/bookings/${booking.id}`}>
                    <Button size="sm" variant="default">
                      {t('common.view')}
                    </Button>
                  </Link>
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(booking.id, 'completed')
                        }
                        disabled={updateStatus.isPending}
                      >
                        {t('status.completed')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(booking.id, 'no_show')
                        }
                        disabled={updateStatus.isPending}
                      >
                        {t('status.no_show')}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteBooking.mutate(booking.id)}
                    disabled={deleteBooking.isPending}
                  >
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {bookingsData && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: bookingsData.meta.last_page }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                variant={page === p ? 'primary' : 'default'}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
