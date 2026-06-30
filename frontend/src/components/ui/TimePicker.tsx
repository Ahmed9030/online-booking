'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

export interface BlockedSlot {
  start: string
  end: string
}

interface TimePickerProps {
  value: string | null
  onChange: (time: string) => void
  label?: string
  error?: string | null
  blockedSlots?: BlockedSlot[]
  openTime?: string
  closeTime?: string
  selectedDate?: string | null
}

const INTERVAL = 15

function formatTimeLabel(time: string, locale: string) {
  const [h, m] = time.split(':').map(Number)
  if (locale === 'ar') {
    if (h < 12) return `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ص`
    const h12 = h === 12 ? 12 : h - 12
    return `${h12}:${String(m).padStart(2, '0')} م`
  }
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function isSlotBlocked(time: string, blockedSlots: BlockedSlot[]) {
  return blockedSlots.some((slot) => time >= slot.start && time < slot.end)
}

export function TimePicker({
  value,
  onChange,
  label,
  error,
  blockedSlots = [],
  openTime = '08:00',
  closeTime = '20:00',
  selectedDate,
}: TimePickerProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const isToday = selectedDate === todayStr

  const nowMinutes = useMemo(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }, [])

  const allSlots = useMemo(() => {
    const slots: string[] = []
    const closeTotal = closeH * 60 + closeM
    let currentTotal = openH * 60 + openM
    while (currentTotal < closeTotal) {
      const h = Math.floor(currentTotal / 60)
      const m = currentTotal % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      currentTotal += INTERVAL
    }
    return slots
  }, [openH, openM, closeH, closeM])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = useCallback(
    (time: string) => {
      onChange(time)
      setOpen(false)
    },
    [onChange],
  )

  const isPastSlot = useCallback(
    (time: string) => {
      if (!isToday) return false
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m < nowMinutes
    },
    [isToday, nowMinutes],
  )

  const hasAvailableSlots = useMemo(
    () =>
      allSlots.some((slot) => {
        if (isSlotBlocked(slot, blockedSlots)) return false
        if (isPastSlot(slot)) return false
        return true
      }),
    [allSlots, blockedSlots, isPastSlot],
  )

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none items-center justify-between gap-2',
          error && '!border-danger',
          isRtl && 'flex-row-reverse',
        )}
      >
        <span className={cn('truncate', !value && 'text-text-muted')}>
          {value
            ? formatTimeLabel(value, locale)
            : isRtl
              ? 'اختر الوقت'
              : 'Select Time'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'shrink-0 text-text-muted transition-transform',
            open && 'rotate-180',
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="neu-card rounded-xl absolute z-50 shadow-xl start-0 mt-1 overflow-hidden p-4"
          style={{ width: '320px' }}
        >
          <div className="grid grid-cols-4 gap-2.5 max-h-72 overflow-y-auto">
            {allSlots.map((time) => {
              const blocked = isSlotBlocked(time, blockedSlots)
              const past = isPastSlot(time)
              const disabled = blocked || past
              const selected = value === time

              return (
                <button
                  key={time}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(time)}
                  className={cn(
                    'rounded-xl py-2.5 text-sm font-medium transition-all',
                    selected && 'neu-slot-selected',
                    !selected && !disabled && 'neu-slot text-text-primary hover:bg-primary/10 hover:border-primary/30',
                    disabled && 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:text-gray-600',
                  )}
                >
                  {formatTimeLabel(time, locale)}
                </button>
              )
            })}
          </div>

          {!hasAvailableSlots && allSlots.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg px-3 py-2 text-center mt-3">
              {isRtl
                ? 'جميع المواعيد محجوزة لهذا اليوم'
                : 'All slots are booked for this day'}
            </p>
          )}

          {allSlots.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">
              {isRtl ? 'لا توجد مواعيد متاحة' : 'No available slots'}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-danger pr-1" role="alert">
          {typeof error === 'string' && error.startsWith('validation.')
            ? error
            : error}
        </p>
      )}
    </div>
  )
}
