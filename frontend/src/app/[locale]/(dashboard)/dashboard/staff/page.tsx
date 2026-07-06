'use client'

import { useState, useEffect } from 'react'
import { useStaffList, useDeleteStaff } from '@/features/staff/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { StaffModal } from '@/components/dashboard/StaffModal'

/**
 * Staff management page displaying a grid of staff members with
 * options to edit or delete each. Includes a modal for adding new staff.
 */
export default function StaffPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const { data: staffData, isLoading } = useStaffList({ page })

  useEffect(() => {
    if (staffData?.meta && page > staffData.meta.last_page) {
      setPage(staffData.meta.last_page)
    }
  }, [page, staffData?.meta?.last_page])
  const deleteStaff = useDeleteStaff()

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.staff')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.staff')}
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffData?.data.map((staff) => (
          <div key={staff.id} className="neu-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">{staff.name}</h3>
                <div className="text-sm text-text-secondary">
                  {staff.services?.length || 0} {t('nav.services')}
                </div>
              </div>
              {staff.photo_url && (
                <img
                  src={staff.photo_url}
                  alt={staff.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
            </div>

            <div className="mt-4 space-y-2">
              <Link href={`/dashboard/staff/${staff.id}`}>
                <Button variant="default" className="w-full" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                className="w-full"
                size="sm"
                onClick={() => deleteStaff.mutate(staff.id)}
                disabled={deleteStaff.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {staffData?.meta && staffData.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-text-secondary">
            {t('common.page')} {staffData.meta.current_page} / {staffData.meta.last_page}
          </span>
          <Button
            variant="default"
            size="sm"
            disabled={page >= staffData.meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      {/* Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
