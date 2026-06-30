'use client'

import { useForm } from 'react-hook-form'
import { useCreateService } from '@/features/services/hooks/useServices'
import { useBranchesList } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'

/** Form data shape for the service creation form. */
interface ServiceFormData {
  name: string
  duration_minutes: number
  price: number
  branch_id: string
}

/** Props for the ServiceModal component. */
interface ServiceModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for creating a new service.
 * Fetches branches from the API to populate the branch dropdown.
 * Includes form fields for name, duration, price, and branch selection,
 * with API integration for creation.
 */
export function ServiceModal({ isOpen, onClose }: ServiceModalProps) {
  const t = useTranslations()
  const createService = useCreateService()
  const { data: branchesData } = useBranchesList()
  const form = useForm<ServiceFormData>()

  const onSubmit = async (data: ServiceFormData) => {
    await createService.mutateAsync({
      ...data,
      duration_minutes: Number(data.duration_minutes),
      price: Number(data.price),
    })
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.services')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
        />

        <Input
          type="number"
          placeholder={t('common.duration')}
          {...form.register('duration_minutes')}
        />

        <Input
          type="number"
          placeholder={t('common.price')}
          {...form.register('price')}
        />

        <select
          className="w-full neu-input"
          {...form.register('branch_id')}
        >
          <option value="">{t('common.select_branch')}</option>
          {branchesData?.data.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createService.isPending}
          >
            {t('common.save')}
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
