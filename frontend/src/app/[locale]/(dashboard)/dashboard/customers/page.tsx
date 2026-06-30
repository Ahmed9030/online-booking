'use client'

import { useState } from 'react'
import { useCustomersList } from '@/features/customers/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

/**
 * Customers list page with a paginated table showing name, phone,
 * visit count, and last visit date. Includes a view action for each customer.
 */
export default function CustomersPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const { data: customersData, isLoading } = useCustomersList({ page })

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t('nav.customers')}</h1>

      {/* Customers Table */}
      <div className="neu-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-text-muted">
            <tr>
              <th className="text-right p-4 font-semibold">{t('common.name')}</th>
              <th className="text-right p-4 font-semibold">{t('common.phone')}</th>
              <th className="text-right p-4 font-semibold">
                {t('common.visits')}
              </th>
              <th className="text-right p-4 font-semibold">
                {t('common.last_visit')}
              </th>
              <th className="text-right p-4 font-semibold">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {customersData?.data.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-text-muted hover:bg-surface-alt"
              >
                <td className="p-4">{customer.name}</td>
                <td className="p-4">{customer.phone}</td>
                <td className="p-4">{customer.visit_count}</td>
                <td className="p-4">
                  {customer.last_visit_at
                    ? new Date(customer.last_visit_at).toLocaleDateString('ar-EG')
                    : '-'}
                </td>
                <td className="p-4">
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <Button size="sm" variant="default">
                      {t('common.view')}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {customersData && (
        <div className="flex justify-center gap-2">
          {Array.from(
            { length: customersData.meta.last_page },
            (_, i) => i + 1,
          ).map((p) => (
            <Button
              key={p}
              variant={page === p ? 'primary' : 'default'}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
