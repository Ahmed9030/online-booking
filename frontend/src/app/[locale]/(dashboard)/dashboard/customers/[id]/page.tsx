'use client'

import { use } from 'react'
import { useCustomerDetail, useCustomerBookings } from '@/features/customers/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const { data: customer, isLoading: loadingCustomer } = useCustomerDetail(id)
  const { data: bookings, isLoading: loadingBookings } = useCustomerBookings(id)

  if (loadingCustomer) return <div>{t('common.loading')}</div>
  if (!customer) return <div>{t('common.not_found')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{customer.name}</h1>
        <Button variant="default" onClick={() => router.push('/dashboard/customers')}>
          {t('common.back')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-text-secondary">{t('common.name')}</dt>
              <dd className="text-text-primary">{customer.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">{t('common.phone')}</dt>
              <dd className="text-text-primary" dir="ltr">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">{t('common.visits')}</dt>
              <dd className="text-text-primary">{customer.visit_count}</dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">{t('common.last_visit')}</dt>
              <dd className="text-text-primary">
                {customer.last_visit_at
                  ? new Date(customer.last_visit_at).toLocaleDateString('ar-EG')
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="neu-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t('common.bookings')}</h2>
          {loadingBookings ? (
            <div>{t('common.loading')}</div>
          ) : bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-text-muted">
                  <tr>
                    <th className="text-right p-3 font-semibold">{t('common.date')}</th>
                    <th className="text-right p-3 font-semibold">{t('common.service')}</th>
                    <th className="text-right p-3 font-semibold">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: any) => (
                    <tr key={booking.id} className="border-b border-text-muted hover:bg-surface-alt">
                      <td className="p-3">
                        {new Date(booking.starts_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3">{booking.service?.name || '-'}</td>
                      <td className="p-3">{t(`status.${booking.status}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-secondary">{t('common.no_bookings')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
