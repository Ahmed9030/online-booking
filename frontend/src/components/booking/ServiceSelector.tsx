'use client'

import { Service } from '@/types'
import { useBookingStore } from '@/store/booking'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useParams } from 'next/navigation'

/** Props for the ServiceSelector component. */
interface ServiceSelectorProps {
  /** Array of available services to display */
  services: Service[]
}

/**
 * Step 1 of the booking flow: displays available services and allows
 * the user to select one. Selecting a service updates the booking store
 * and navigates to the staff selection page.
 */
export function ServiceSelector({ services }: ServiceSelectorProps) {
  const selectService = useBookingStore((s) => s.selectService)
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const businessSlug = params.businessSlug as string
  const branchSlug = params.branchSlug as string

  const handleSelect = (service: Service) => {
    selectService(service)
    if (businessSlug && branchSlug) {
      router.push(`/book/${businessSlug}/${branchSlug}/staff-select`)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">
        {t('booking.select_service')}
      </h2>

      <div className="grid gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleSelect(service)}
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
