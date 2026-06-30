'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { branchSchema } from '@/lib/validations'
import { useCreateBranch } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'

/** Form data type inferred from the branch validation schema. */
type BranchFormData = z.infer<typeof branchSchema>

/** Props for the BranchModal component. */
interface BranchModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Generates a URL-friendly slug from a branch name.
 *
 * @param name - The branch name to convert.
 * @returns A lowercase, hyphenated slug string.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Modal component for creating a new branch.
 * Includes form fields for name, address, city, WhatsApp number, and slug,
 * with auto-slug generation from the name field,
 * Zod validation, and API integration.
 */
export function BranchModal({ isOpen, onClose }: BranchModalProps) {
  const t = useTranslations()
  const createBranch = useCreateBranch()
  const form = useForm({
    resolver: zodResolver(branchSchema),
  })

  const nameValue = form.watch('name')

  useEffect(() => {
    if (nameValue) {
      form.setValue('slug', generateSlug(nameValue))
    }
  }, [nameValue, form])

  const onSubmit = async (data: BranchFormData) => {
    await createBranch.mutateAsync(data)
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.branches')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />

        <Input
          placeholder={t('common.address')}
          {...form.register('address')}
          error={form.formState.errors.address?.message}
        />

        <Input
          placeholder={t('common.city')}
          {...form.register('city')}
          error={form.formState.errors.city?.message}
        />

        <Input
          placeholder={t('common.whatsapp')}
          {...form.register('whatsapp_number')}
          error={form.formState.errors.whatsapp_number?.message}
        />

        <Input
          placeholder="slug"
          {...form.register('slug')}
          error={form.formState.errors.slug?.message}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createBranch.isPending}
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
