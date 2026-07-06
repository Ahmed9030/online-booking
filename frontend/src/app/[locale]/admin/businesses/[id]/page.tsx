'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import {
  useAdminBusinessDetail,
  useUpdateBusinessSubscription,
  useUpdateBusinessStatus,
} from '@/features/admin/hooks/useAdminBusinesses'
import { cn } from '@/lib/utils'

/** Maps subscription statuses to their badge colour classes. */
const statusColors: Record<string, string> = {
  trial: 'text-yellow-600 bg-yellow-100',
  active: 'text-green-600 bg-green-100',
  expired: 'text-red-600 bg-red-100',
  suspended: 'text-gray-600 bg-gray-100',
}

/**
 * Admin business detail page — view and manage a single business.
 *
 * Displays business information, owner details, aggregate counts,
 * subscription expiry, and provides controls to update the subscription
 * status or activate/suspend the business.
 *
 * @returns The business detail page content.
 */
export default function AdminBusinessDetailPage() {
  const t = useTranslations()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { data: business, isLoading } = useAdminBusinessDetail(id)
  const updateSubscription = useUpdateBusinessSubscription()
  const updateStatus = useUpdateBusinessStatus()

  const [selectedStatus, setSelectedStatus] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (business) {
      setSelectedStatus(business.subscription_status || '')
      setExpiresAt(
        business.subscription_expires_at
          ? business.subscription_expires_at.split('T')[0]
          : '',
      )
    }
  }, [business])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-text-secondary">
        {t('common.loading')}
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-40 text-text-secondary">
        {t('common.not_found')}
      </div>
    )
  }

  /** Persists the selected subscription status and optional expiry date to the API. */
  const handleUpdateSubscription = async () => {
    if (!selectedStatus) return
    await updateSubscription.mutateAsync({
      id: business.id,
      subscription_status: selectedStatus,
      subscription_expires_at: expiresAt || null,
    })
  }

  /** Toggles the business between active and suspended status. */
  const handleToggleStatus = async () => {
    const nextStatus = business.subscription_status === 'suspended' ? 'active' : 'suspended'
    await updateStatus.mutateAsync({
      id: business.id,
      subscription_status: nextStatus,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => router.push('/admin/businesses')}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        ← {t('admin.back_to_businesses')}
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {business.name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {business.slug}
          </p>
        </div>
        <span
          className={cn(
            'inline-block px-3 py-1 rounded-full text-sm font-medium',
            statusColors[business.subscription_status] || '',
          )}
        >
          {t(`admin.${business.subscription_status}`)}
        </span>
      </div>

      {business.description && (
        <p className="text-sm text-text-secondary">{business.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('admin.branches')}</span>
          <p className="text-xl font-bold text-text-primary mt-1">
            {business.branches_count ?? 0}
          </p>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('common.staff')}</span>
          <p className="text-xl font-bold text-text-primary mt-1">
            {business.staff_count ?? 0}
          </p>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('common.services')}</span>
          <p className="text-xl font-bold text-text-primary mt-1">
            {business.services_count ?? 0}
          </p>
        </div>
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">{t('common.bookings')}</span>
          <p className="text-xl font-bold text-text-primary mt-1">
            {business.bookings_count ?? 0}
          </p>
        </div>
      </div>

      {business.owner && (
        <div className="neu-card rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('admin.owner_info')}
          </h3>
          <div className="text-sm text-text-secondary space-y-1">
            <p>{t('common.name')}: {business.owner.name}</p>
            <p>{t('common.email')}: {business.owner.email}</p>
            {business.owner.phone && (
              <p>{t('common.phone')}: {business.owner.phone}</p>
            )}
          </div>
        </div>
      )}

      {business.subscription_expires_at && (
        <div className="neu-card rounded-2xl p-4">
          <span className="text-xs text-text-secondary">
            {t('admin.subscription_expires')}
          </span>
          <p className="text-sm text-text-primary mt-1">
            {new Date(business.subscription_expires_at).toLocaleDateString('ar-SA')}
          </p>
        </div>
      )}

      <div className="neu-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('admin.update_subscription')}
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="neu-input rounded-xl px-4 py-2 text-sm bg-surface border border-border text-text-primary flex-1"
          >
            <option value="">{t('admin.select_status')}</option>
            <option value="trial">{t('admin.trial')}</option>
            <option value="active">{t('admin.active')}</option>
            <option value="expired">{t('admin.expired')}</option>
            <option value="suspended">{t('admin.suspended')}</option>
          </select>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="neu-input rounded-xl px-4 py-2 text-sm bg-surface border border-border text-text-primary"
            placeholder={t('admin.expiry_date')}
          />
          <button
            onClick={handleUpdateSubscription}
            disabled={!selectedStatus || updateSubscription.isPending}
            className="neu-btn-primary rounded-xl px-4 py-2 text-sm font-medium"
          >
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleToggleStatus}
          disabled={updateStatus.isPending}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-all',
            business.subscription_status === 'suspended'
              ? 'neu-btn-primary text-green-600'
              : 'neu-btn text-red-600',
          )}
        >
          {business.subscription_status === 'suspended'
            ? t('admin.activate_business')
            : t('admin.suspend_business')}
        </button>
      </div>
    </div>
  )
}
