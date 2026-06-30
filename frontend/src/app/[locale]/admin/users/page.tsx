'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminUsers, useToggleUserStatus } from '@/features/admin/hooks/useAdminUsers'
import { cn } from '@/lib/utils'

/** Maps user roles to their badge colour classes. */
const roleColors: Record<string, string> = {
  owner: 'text-blue-600 bg-blue-100',
  staff: 'text-purple-600 bg-purple-100',
  admin: 'text-red-600 bg-red-100',
  customer: 'text-green-600 bg-green-100',
}

/**
 * Admin users list page — paginated table of all platform users.
 *
 * Supports filtering by role and searching by name, email, or phone.
 * Each row displays the user's role badge, active status, and a toggle
 * button to activate or deactivate the account.
 *
 * @returns The admin users list page content.
 */
export default function AdminUsersPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAdminUsers({
    page,
    role: roleFilter || undefined,
    search: search || undefined,
  })
  const toggleStatus = useToggleUserStatus()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        {t('admin.users')}
      </h1>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="neu-input rounded-xl px-4 py-2 text-sm flex-1 max-w-xs bg-surface border border-border text-text-primary placeholder:text-text-secondary"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="neu-input rounded-xl px-4 py-2 text-sm bg-surface border border-border text-text-primary"
        >
          <option value="">{t('admin.all_roles')}</option>
          <option value="owner">{t('role.owner')}</option>
          <option value="staff">{t('role.staff')}</option>
          <option value="admin">{t('role.admin')}</option>
          <option value="customer">{t('role.customer')}</option>
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
                  <th className="text-right py-3 px-4 font-medium">{t('common.email')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.phone')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.role')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('admin.status')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.date')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-surface-hover/50">
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {user.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {user.phone || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                          roleColors[user.role] || '',
                        )}
                      >
                        {t(`role.${user.role}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.is_active
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100',
                        )}
                      >
                        {user.is_active ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus.mutate(user.id)}
                        disabled={toggleStatus.isPending}
                        className={cn(
                          'text-xs font-medium transition-colors',
                          user.is_active
                            ? 'text-red-500 hover:text-red-700'
                            : 'text-green-500 hover:text-green-700',
                        )}
                      >
                        {user.is_active ? t('admin.deactivate') : t('admin.activate')}
                      </button>
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
