'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateStaff } from '@/features/staff/hooks/useStaff'
import { useBranchesList } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'

/** Zod validation schema for the staff creation form. */
const staffSchema = z.object({
  name: z.string().min(2, 'validation.name_short'),
  branch_id: z.string().uuid('validation.invalid_branch'),
})

/** Props for the StaffModal component. */
interface StaffModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for creating a new staff member.
 * Fetches branches from the API to populate the branch dropdown.
 * Includes a form with name and branch selection fields,
 * with Zod validation and API integration.
 */
export function StaffModal({ isOpen, onClose }: StaffModalProps) {
  const t = useTranslations()
  const createStaff = useCreateStaff()
  const { data: branchesData } = useBranchesList()
  const form = useForm({
    resolver: zodResolver(staffSchema),
  })

  const onSubmit = async (data: z.infer<typeof staffSchema>) => {
    await createStaff.mutateAsync(data)
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.staff')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
          error={form.formState.errors.name?.message}
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
            disabled={createStaff.isPending}
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
