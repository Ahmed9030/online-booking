'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string | null
  onChange: (date: string) => void
  label?: string
  error?: string | null
  minDate?: string
}

const DAYS_SHORT = { ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'], en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] }

function getMonthDays(year: number, month: number, locale: string): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let day = 1
  for (let w = 0; w < 6; w++) {
    const row: (number | null)[] = []
    for (let d = 0; d < 7; d++) {
      const col = locale === 'ar' ? 6 - d : d
      if ((w === 0 && col < startDow) || day > daysInMonth) {
        row.push(null)
      } else {
        row.push(day++)
      }
    }
    weeks.push(row)
    if (day > daysInMonth) break
  }
  return weeks
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export function DatePicker({ value, onChange, label, error, minDate }: DatePickerProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const today = new Date()
  const parsedValue = value ? new Date(value + 'T00:00:00') : null

  const [viewYear, setViewYear] = useState(parsedValue?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsedValue?.getMonth() ?? today.getMonth())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const weeks = getMonthDays(viewYear, viewMonth, locale)
  const dayNames = DAYS_SHORT[isRtl ? 'ar' : 'en']

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long' })
  const yearName = viewYear.toLocaleString(isRtl ? 'ar-EG' : 'en-US')

  const displayLabel = parsedValue
    ? parsedValue.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : ''

  function selectDay(day: number) {
    const y = viewYear
    const m = viewMonth
    const d = day
    const selected = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    onChange(selected)
    setOpen(false)
  }

  function isDisabled(day: number): boolean {
    if (!minDate) return false
    const d = new Date(viewYear, viewMonth, day)
    const min = new Date(minDate + 'T00:00:00')
    return d < min
  }

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none items-center justify-between gap-2',
          error && '!border-danger',
          isRtl && 'flex-row-reverse',
        )}
      >
        <span className={cn('truncate', !parsedValue && 'text-text-muted')}>
          {parsedValue ? displayLabel : (isRtl ? 'اختر التاريخ' : 'Select Date')}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="neu-card p-4 rounded-xl mt-1 absolute z-50 shadow-xl start-0"
          style={{ width: '300px' }}
        >
          <div className={cn('flex items-center justify-between mb-3', isRtl && 'flex-row-reverse')}>
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center text-text-secondary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(isRtl && 'rotate-180')}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-text-primary">{monthName} {yearName}</span>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center text-text-secondary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(isRtl && 'rotate-180')}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {dayNames.map((d, i) => (
              <div key={i} className="text-xs font-medium text-text-muted text-center h-8 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((day, i) => {
              if (day === null) return <div key={i} />
              const date = new Date(viewYear, viewMonth, day)
              const selected = parsedValue && isSameDay(date, parsedValue)
              const disabled = isDisabled(day)
              const isTodayDate = isToday(date)

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-9 w-full rounded-lg text-sm font-medium transition-all',
                    selected && 'neu-slot-selected',
                    !selected && !disabled && 'hover:bg-surface-hover text-text-primary',
                    !selected && disabled && 'text-text-muted cursor-not-allowed opacity-40',
                    !selected && isTodayDate && 'text-primary font-bold',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger pr-1" role="alert">{error}</p>
      )}
    </div>
  )
}
