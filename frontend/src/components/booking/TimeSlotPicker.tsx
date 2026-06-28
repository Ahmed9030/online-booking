'use client'

import { AvailabilitySlot } from '@/types'
import { useBookingStore } from '@/store/booking'
import { useTranslations } from 'next-intl'

interface TimeSlotPickerProps {
  slots: AvailabilitySlot[]
}

export function TimeSlotPicker({ slots }: TimeSlotPickerProps) {
  const selectSlot = useBookingStore((s) => s.selectSlot)
  const selectedSlot = useBookingStore((s) => s.selectedSlot)
  const t = useTranslations()

  if (slots.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">
          {t('booking.select_time')}
        </h2>
        <p className="text-text-muted text-center py-8">
          لا توجد مواعيد متاحة لهذا اليوم
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">
        {t('booking.select_time')}
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const startTime = new Date(slot.starts_at).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const isSelected = selectedSlot?.id === slot.id

          return (
            <button
              key={slot.id}
              onClick={() => selectSlot(slot)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? 'neu-slot-selected'
                  : 'neu-slot text-text-primary'
              }`}
            >
              {startTime}
            </button>
          )
        })}
      </div>
    </div>
  )
}
