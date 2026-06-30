'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminSubscriptions } from '@/features/admin/hooks/useAdminSubscriptions'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

/** Maps subscription statuses to their badge colour classes. */
const statusColors: Record<string, string> = {
  trial: 'text-yellow-600 bg-yellow-100',
  active: 'text-green-600 bg-green-100',
  expired: 'text-red-600 bg-red-100',
  suspended: 'text-gray-600 bg-gray-100',
}

/**
 * Admin subscriptions list page — paginated table of all platform subscriptions.
 *
 * Displays each business as a subscription entry with its status,
 * expiry date, owner, and aggregate counts. Supports filtering by
 * subscription status.
 *
 * @returns The admin subscriptions list page content.
 */
export default function AdminSubscriptionsPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useAdminSubscriptions({
    page,
    subscription_status: statusFilter || undefined,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        {t('admin.subscriptions')}
      </h1>

      <div className="flex items-center gap-3">
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
                  <th className="text-right py-3 px-4 font-medium">{t('admin.subscription_status')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('admin.expires')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('admin.branches')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.staff')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-surface-hover/50">
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {sub.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {sub.owner?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[sub.subscription_status] || '',
                        )}
                      >
                        {t(`admin.${sub.subscription_status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {sub.subscription_expires_at
                        ? new Date(sub.subscription_expires_at).toLocaleDateString('ar-SA')
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {sub.branches_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {sub.staff_count ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/businesses/${sub.id}`}
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
