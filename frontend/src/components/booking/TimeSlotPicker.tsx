'use client'

import { AvailabilitySlot } from '@/types'
import { useBookingStore } from '@/store/booking'
import { useTranslations, useLocale } from 'next-intl'

/** Props for the TimeSlotPicker component. */
interface TimeSlotPickerProps {
  /** Array of available time slots to display */
  slots: AvailabilitySlot[]
}

/**
 * Step 3 of the booking flow: displays available time slots in a grid
 * and allows the user to select one, advancing the booking store to step 4.
 */
export function TimeSlotPicker({ slots }: TimeSlotPickerProps) {
  const selectSlot = useBookingStore((s) => s.selectSlot)
  const selectedSlot = useBookingStore((s) => s.selectedSlot)
  const locale = useLocale()
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
          const startTime = new Date(slot.starts_at).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Cairo',
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
