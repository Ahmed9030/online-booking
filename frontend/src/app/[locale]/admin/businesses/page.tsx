'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useAdminBusinesses } from '@/features/admin/hooks/useAdminBusinesses'
import { cn } from '@/lib/utils'

/** Maps subscription statuses to their badge colour classes. */
const statusColors: Record<string, string> = {
  trial: 'text-yellow-600 bg-yellow-100',
  active: 'text-green-600 bg-green-100',
  expired: 'text-red-600 bg-red-100',
  suspended: 'text-gray-600 bg-gray-100',
}

/**
 * Admin businesses list page — paginated table of all platform businesses.
 *
 * Supports searching by name/slug and filtering by subscription status.
 * Each row links to the business detail page for subscription management.
 *
 * @returns The admin businesses list page content.
 */
export default function AdminBusinessesPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useAdminBusinesses({
    page,
    search: search || undefined,
    subscription_status: statusFilter || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {t('admin.businesses')}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="neu-input rounded-xl px-4 py-2 text-sm flex-1 max-w-xs bg-surface border border-border text-text-primary placeholder:text-text-secondary"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="neu-input rounded-xl px-4 py-2 text-sm bg-surface border border-border text-text-primary"
        >
          <option value="">{t('admin.all_statuses')}</option>
          <option value="trial">{t('admin.trial')}</option>
          <option value="active">{t('admin.active')}</option>
          <option value="expired">{t('admin.expired')}</option>
          <option value="suspended">{t('admin.suspended')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-text-secondary">
          {t('common.loading')}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs uppercase tracking-wide">
                  <th className="text-right py-3 px-4 font-medium">{t('common.name')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.owner')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('admin.subscription')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('admin.branches')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.staff')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.bookings')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.date')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((business) => (
                  <tr key={business.id} className="border-b border-border/50 hover:bg-surface-hover/50">
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {business.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {business.owner?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[business.subscription_status] || 'text-gray-600 bg-gray-100',
                        )}
                      >
                        {t(`admin.${business.subscription_status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {business.branches_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {business.staff_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {business.bookings_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {new Date(business.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {t('common.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-xl text-xs font-medium transition-all',
                    p === page
                      ? 'bg-primary text-white'
                      : 'neu-btn text-text-secondary',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
