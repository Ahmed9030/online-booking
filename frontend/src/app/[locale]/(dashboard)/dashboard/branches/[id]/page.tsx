'use client'

import { useBranchDetail, useUpdateBranch, useUpdateBranchWorkingHours } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from '@/i18n/routing'
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor'
import { useUiStore } from '@/store/ui'
import { useEffect, use } from 'react'

/** Props for the branch detail page route. */
interface BranchDetailPageProps {
  params: Promise<{
    /** The UUID of the branch to edit */
    id: string
  }>
}

/** Form data for editing a branch. */
interface BranchEditFormData {
  name: string
  address: string
  city: string
  whatsapp_number: string
  slug: string
}

/**
 * Branch edit page with pre-populated form fields loaded from the API.
 * Allows updating branch name, address, city, WhatsApp number, slug,
 * and working hours for each day of the week.
 */
export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const { id } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const { data: branch, isLoading } = useBranchDetail(id)
  const updateBranch = useUpdateBranch()
  const updateWorkingHours = useUpdateBranchWorkingHours()
  const showToast = useUiStore((s) => s.showToast)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchEditFormData>()

  useEffect(() => {
    if (branch) {
      reset({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        whatsapp_number: branch.whatsapp_number,
        slug: branch.slug,
      })
    }
  }, [branch, reset])

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!branch) return <div>{t('common.not_found')}</div>

  const onSubmit = async (data: BranchEditFormData) => {
    await updateBranch.mutateAsync({ id, ...data })
    router.push('/dashboard/branches')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{branch.name}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="lg:col-span-2 neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('common.name')}
              {...register('name', { required: true })}
              error={errors.name ? 'validation.required' : null}
            />

            <Input
              label={t('common.address')}
              {...register('address', { required: true })}
              error={errors.address ? 'validation.required' : null}
            />

            <Input
              label={t('common.city')}
              {...register('city')}
            />

            <Input
              label={t('common.whatsapp')}
              {...register('whatsapp_number', { required: true })}
              error={errors.whatsapp_number ? 'validation.required' : null}
            />

            <Input
              label="Slug"
              {...register('slug', { required: true })}
              error={errors.slug ? 'validation.required' : null}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={updateBranch.isPending}
              >
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={() => router.push('/dashboard/branches')}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </div>

        {/* Working Hours */}
        <div className="neu-card p-6">
          <WorkingHoursEditor
            initialHours={branch.working_hours}
            onUpdate={(hours) =>
              updateWorkingHours.mutate(
                {
                  id,
                  working_hours: hours.map((h) => ({
                    weekday: h.weekday,
                    open_time: h.start_time,
                    close_time: h.end_time,
                  })),
                },
                {
                  onSuccess: () => showToast('تم حفظ المواعيد بنجاح', 'success'),
                  onError: () => showToast('حدث خطأ أثناء الحفظ', 'error'),
                },
              )
            }
          />
        </div>
      </div>
    </div>
  )
}
