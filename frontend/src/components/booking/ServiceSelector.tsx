'use client'

import { Service } from '@/types'
import { useBookingStore } from '@/store/booking'
import { useTranslations } from 'next-intl'

interface ServiceSelectorProps {
  services: Service[]
}

export function ServiceSelector({ services }: ServiceSelectorProps) {
  const selectService = useBookingStore((s) => s.selectService)
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">
        {t('booking.select_service')}
      </h2>

      <div className="grid gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => selectService(service)}
            className="neu-card flex items-center justify-between p-4 w-full text-right cursor-pointer hover:scale-[1.01]"
          >
            <div className="text-right">
              <div className="font-semibold text-text-primary">{service.name}</div>
              <div className="text-sm text-text-secondary mt-0.5">
                {service.duration_minutes} دقيقة
              </div>
            </div>
            <div className="text-lg font-bold text-primary shrink-0 mr-4">
              {service.price} ج.م
            </div>
          </button>
        ))}
      </div>

      {services.length === 0 && (
        <p className="text-text-muted text-center py-8">لا توجد خدمات متاحة</p>
      )}
    </div>
  )
}
