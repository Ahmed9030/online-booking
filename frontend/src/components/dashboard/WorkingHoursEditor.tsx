'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'

/** Props for the WorkingHoursEditor component. */
interface WorkingHoursEditorProps {
  /** The UUID of the staff member to edit hours for (optional, used by parent) */
  staffId?: string
  /** Existing working hours to pre-populate the form */
  initialHours?: Array<{ weekday: number; open_time?: string | null; close_time?: string | null }>
  /** Callback fired with the formatted working hours array when saved */
  onUpdate: (hours: Array<{ weekday: number; start_time?: string | null; end_time?: string | null }>) => void
}

/** Days of the week (Sunday=0 to Saturday=6) with Arabic labels. */
const WEEKDAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

/**
 * Component for editing a staff member's weekly working hours.
 * Displays time inputs for each day of the week (Sunday-Saturday)
 * and formats the data for API submission on save.
 */
export function WorkingHoursEditor({ staffId, initialHours, onUpdate }: WorkingHoursEditorProps) {
  void staffId
  const t = useTranslations()
  const [hours, setHours] = useState<Record<number, { start?: string; end?: string }>>({})
  const [dayOff, setDayOff] = useState<Record<number, boolean>>({})

  const stableInitialHours = useMemo(() => initialHours ?? [], [initialHours])
  const hasInitialised = useRef(false)

  useEffect(() => {
    if (hasInitialised.current) return
    hasInitialised.current = true

    const init: Record<number, { start?: string; end?: string }> = {}
    const off: Record<number, boolean> = {}
    const hours = stableInitialHours
    for (const day of WEEKDAYS) {
      const h = hours.find((wh) => wh.weekday === day.value)
      if (h?.open_time && h?.close_time) {
        init[day.value] = { start: h.open_time.slice(0, 5), end: h.close_time.slice(0, 5) }
        off[day.value] = false
      } else {
        off[day.value] = true
      }
    }
    setHours(init)
    setDayOff(off)
  }, [stableInitialHours])

  /**
   * Updates the local state when a time input changes.
   *
   * @param weekday - The day index (0-6).
   * @param field - Whether this is the start or end time.
   * @param value - The new time value (HH:MM).
   */
  const handleChange = (weekday: number, field: 'start' | 'end', value: string) => {
    setHours((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value,
      },
    }))
  }

  /** Toggles a day as off (closed) or on (open). */
  const toggleDayOff = (weekday: number) => {
    setDayOff((prev) => {
      const next = { ...prev, [weekday]: !prev[weekday] }
      if (next[weekday]) {
        setHours((h) => {
          const copy = { ...h }
          delete copy[weekday]
          return copy
        })
      } else {
        setHours((h) => {
          if (!h[weekday]) {
            return { ...h, [weekday]: { start: '09:00', end: '17:00' } }
          }
          return h
        })
      }
      return next
    })
  }

  /** Copies hours from one day to all other days. */
  const copyToAll = (sourceWeekday: number) => {
    const source = hours[sourceWeekday]
    if (!source) return
    setHours((prev) => {
      const next = { ...prev }
      for (const day of WEEKDAYS) {
        next[day.value] = { ...source }
      }
      return next
    })
    setDayOff({})
  }

  /** Formats ALL 7 days and passes them to the parent callback. */
  const handleSave = () => {
    const formatted = WEEKDAYS.map((day) => {
      const isOff = dayOff[day.value]
      const times = hours[day.value]
      return {
        weekday: day.value,
        start_time: isOff || !times?.start ? null : times.start.slice(0, 5),
        end_time: isOff || !times?.end ? null : times.end.slice(0, 5),
      }
    })
    onUpdate(formatted)
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t('common.working_hours')}</h3>
      {WEEKDAYS.map((day) => {
        const isOff = dayOff[day.value]
        return (
          <div key={day.value} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">{day.label}</label>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!isOff}
                  onChange={() => toggleDayOff(day.value)}
                  className="h-4 w-4 rounded border-border"
                />
                {t('common.day_off')}
              </label>
            </div>
            {isOff ? (
              <p className="text-sm text-text-secondary/60 italic">{t('common.closed')}</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={hours[day.value]?.start || ''}
                  onChange={(e) => handleChange(day.value, 'start', e.target.value)}
                  placeholder="09:00"
                />
                <Input
                  type="time"
                  value={hours[day.value]?.end || ''}
                  onChange={(e) => handleChange(day.value, 'end', e.target.value)}
                  placeholder="18:00"
                />
                <button
                  type="button"
                  onClick={() => copyToAll(day.value)}
                  className="px-2 text-xs text-primary hover:text-primary/80 shrink-0"
                  title={t('common.copy_to_all')}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        )
      })}
      <Button variant="primary" className="w-full mt-2" onClick={handleSave}>
        {t('common.save')}
      </Button>
    </div>
  )
}
