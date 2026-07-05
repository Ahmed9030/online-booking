'use client'

import { useServiceDetail, useUpdateService } from '@/features/services/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from '@/i18n/routing'
import { useEffect, use } from 'react'

/** Props for the service detail page route. */
interface ServiceDetailPageProps {
  params: Promise<{
    /** The UUID of the service to edit */
    id: string
  }>
}

/** Form data for editing a service. */
interface ServiceEditFormData {
  name: string
  duration_minutes: number
  price: number
}

/**
 * Service edit page with pre-populated form fields loaded from the API.
 * Allows updating service name, duration, and price.
 */
export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const { data: service, isLoading } = useServiceDetail(id)
  const updateService = useUpdateService()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceEditFormData>()

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        duration_minutes: service.duration_minutes,
        price: service.price,
      })
    }
  }, [service, reset])

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!service) return <div>{t('common.not_found')}</div>

  const onSubmit = async (data: ServiceEditFormData) => {
    await updateService.mutateAsync({
      id,
      ...data,
      duration_minutes: Number(data.duration_minutes),
      price: Number(data.price),
    })
    router.push('/dashboard/services')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{service.name}</h1>

      <div className="neu-card p-6 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('common.name')}
            {...register('name', { required: true })}
            error={errors.name ? 'validation.required' : null}
          />

          <Input
            label={t('common.duration')}
            type="number"
            {...register('duration_minutes', { required: true, valueAsNumber: true })}
            error={errors.duration_minutes ? 'validation.required' : null}
          />

          <Input
            label={t('common.price')}
            type="number"
            {...register('price', { required: true, valueAsNumber: true })}
            error={errors.price ? 'validation.required' : null}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={updateService.isPending}
            >
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="default"
              className="flex-1"
              onClick={() => router.push('/dashboard/services')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
