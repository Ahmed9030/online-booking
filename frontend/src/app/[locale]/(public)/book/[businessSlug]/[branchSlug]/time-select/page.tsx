'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useBookingStore } from '@/store/booking'
import { useAvailability } from '@/features/bookings/hooks/useAvailability'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { useState } from 'react'

export default function TimeSelectPage() {
  const t = useTranslations()
  const router = useRouter()
  const branch = useBookingStore((s) => s.branch)
  const service = useBookingStore((s) => s.service)
  const staff = useBookingStore((s) => s.staff)
  const selectDate = useBookingStore((s) => s.selectDate)
  const selectedDate = useBookingStore((s) => s.selectedDate)
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(selectedDate || today)

  const { data: slots, isLoading } = useAvailability({
    branch_id: branch?.id || '',
    service_id: service?.id || '',
    staff_id: staff?.id || null,
    date: branch ? date : '',
  })

  if (!branch || !service) {
    router.push('/')
    return null
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-text-primary">
        {t('booking.select_time')}
      </h1>

      <div className="neu-card p-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {t('booking.select_date') || 'اختر التاريخ'}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            selectDate(e.target.value)
          }}
          className="neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary"
          min={today}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-xl bg-text-muted/10 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <TimeSlotPicker slots={slots || []} />
      )}
    </div>
  )
}
