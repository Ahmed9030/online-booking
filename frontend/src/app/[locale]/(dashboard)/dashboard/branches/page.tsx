'use client'

import { useState } from 'react'
import { useBranchesList, useDeleteBranch } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { BranchModal } from '@/components/dashboard/BranchModal'

/**
 * Branches management page listing all branches with edit and delete actions.
 * Includes a modal for creating new branches.
 */
export default function BranchesPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: branchesData, isLoading } = useBranchesList()
  const deleteBranch = useDeleteBranch()

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.branches')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.branches')}
        </Button>
      </div>

      {/* Branches List */}
      <div className="space-y-3">
        {branchesData?.data.map((branch) => (
          <div key={branch.id} className="neu-card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary">{branch.name}</h3>
              <div className="text-sm text-text-secondary">{branch.address}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/branches/${branch.id}`}>
                <Button variant="default" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteBranch.mutate(branch.id)}
                disabled={deleteBranch.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
