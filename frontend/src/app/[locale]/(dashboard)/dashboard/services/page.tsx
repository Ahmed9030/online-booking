'use client'

import { useState } from 'react'
import { useServicesList, useDeleteService } from '@/features/services/hooks/useServices'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ServiceModal } from '@/components/dashboard/ServiceModal'

/**
 * Services management page displaying a grid of services with
 * duration and price info. Includes edit, delete, and create actions.
 */
export default function ServicesPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: servicesData, isLoading } = useServicesList()
  const deleteService = useDeleteService()

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.services')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.services')}
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servicesData?.data.map((service) => (
          <div key={service.id} className="neu-card p-4">
            <h3 className="font-semibold text-primary">{service.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <div>{service.duration_minutes} {t('common.minutes')}</div>
              <div>{service.price} ج.م</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/dashboard/services/${service.id}`} className="flex-1">
                <Button variant="default" className="w-full" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteService.mutate(service.id)}
                disabled={deleteService.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
