'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface NeumorphicTimePickerProps {
  value: string | null
  onChange: (time: string) => void
  label?: string
  error?: string | null
  minuteStep?: 1 | 5 | 15 | 30
  disabled?: boolean
}

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 5
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT

function parse24h(value: string | null): { hour12: number; minute: number; isPM: boolean } | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { hour12, minute: m, isPM: h >= 12 }
}

function roundStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step
  if (rounded >= 60) return 0
  if (rounded < 0) return 0
  return rounded
}

function to24hString(hour12: number, minute: number, isPM: boolean): string {
  const h = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12)
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

interface PickerColumnProps {
  items: { value: number; label: string }[]
  value: number
  onChange: (v: number) => void
  label: string
}

function PickerColumn({ items, value, onChange, label }: PickerColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inited = useRef(false)

  useEffect(() => {
    if (ref.current && !inited.current) {
      inited.current = true
      const idx = items.findIndex((i) => i.value === value)
      if (idx >= 0) {
        const child = ref.current.children[idx + 1] as HTMLElement
        child?.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
    }
  }, [value, items])

  const handleClick = useCallback(
    (v: number) => {
      onChange(v)
      if (ref.current) {
        const idx = items.findIndex((i) => i.value === v)
        const child = ref.current.children[idx + 1] as HTMLElement
        child?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    },
    [onChange],
  )

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs text-text-muted text-center mb-1.5 font-medium">{label}</div>
      <div className="relative overflow-hidden rounded-xl" style={{ height: PICKER_HEIGHT }}>
        <div
          className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, var(--surface), transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }}
        />
        <div
          className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[44px] rounded-lg bg-primary/5 pointer-events-none z-10"
        />
        <div
          ref={ref}
          className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div style={{ height: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2 }} />
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              tabIndex={0}
              className={cn(
                'flex items-center justify-center w-full text-sm font-medium snap-center transition-all duration-150',
                'select-none',
                item.value === value
                  ? 'text-primary font-bold scale-105'
                  : 'text-text-muted hover:text-text-secondary',
              )}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => handleClick(item.value)}
            >
              {item.label}
            </button>
          ))}
          <div style={{ height: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2 }} />
        </div>
      </div>
    </div>
  )
}

export function NeumorphicTimePicker({
  value,
  onChange,
  label,
  error,
  minuteStep = 5,
  disabled = false,
}: NeumorphicTimePickerProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parsed = useMemo(() => parse24h(value), [value])
  const [hour12, setHour12] = useState(parsed?.hour12 ?? 12)
  const [minute, setMinute] = useState(parsed != null ? roundStep(parsed.minute, minuteStep) : 0)
  const [isPM, setIsPM] = useState(parsed?.isPM ?? false)

  useEffect(() => {
    if (!open && parsed) {
      setHour12(parsed.hour12)
      setMinute(roundStep(parsed.minute, minuteStep))
      setIsPM(parsed.isPM)
    }
  }, [parsed, open, minuteStep])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleEscape = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  const commitTime = useCallback(
    (h: number, m: number, pm: boolean) => {
      onChange(to24hString(h, m, pm))
      setOpen(false)
    },
    [onChange],
  )

  const hours = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const v = i + 1
        return { value: v, label: String(v).padStart(2, '0') }
      }),
    [],
  )

  const minutes = useMemo(() => {
    const items: { value: number; label: string }[] = []
    for (let i = 0; i < 60; i += minuteStep) {
      items.push({ value: i, label: String(i).padStart(2, '0') })
    }
    return items
  }, [minuteStep])

  const displayValue = useMemo(() => {
    if (!value) return ''
    if (locale === 'ar') {
      const p = parse24h(value)
      if (!p) return value
      return `${p.hour12}:${String(p.minute).padStart(2, '0')} ${p.isPM ? 'م' : 'ص'}`
    }
    const p = parse24h(value)
    if (!p) return value
    return `${p.hour12}:${String(p.minute).padStart(2, '0')} ${p.isPM ? 'PM' : 'AM'}`
  }, [value, locale])

  return (
    <div className="space-y-1.5 relative" ref={containerRef} onKeyDown={handleEscape}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">{label}</label>
      )}

      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setOpen((o) => !o)
          }
        }}
        disabled={disabled}
        className={cn(
          'neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none items-center justify-between gap-2',
          error && '!border-danger',
          isRtl && 'flex-row-reverse',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={cn('truncate', !value && 'text-text-muted')}>
          {value ? displayValue : isRtl ? 'اختر الوقت' : 'Select Time'}
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
            'shrink-0 text-text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="neu-card rounded-xl absolute z-50 shadow-xl start-0 mt-2 p-4 w-full"
          style={{ minWidth: '320px' }}
          role="dialog"
          aria-modal="true"
          aria-label={label || (isRtl ? 'اختيار الوقت' : 'Time picker')}
        >
          <div className={cn('flex gap-3 items-stretch', isRtl && 'flex-row-reverse')}>
            <PickerColumn
              items={hours}
              value={hour12}
              onChange={setHour12}
              label={isRtl ? 'ساعة' : 'Hour'}
            />

            <div className="w-px bg-border shrink-0 self-stretch" />

            <PickerColumn
              items={minutes}
              value={minute}
              onChange={setMinute}
              label={isRtl ? 'دقيقة' : 'Min'}
            />

            <div className="w-px bg-border shrink-0 self-stretch" />

            <div className="flex flex-col gap-1.5 justify-center shrink-0">
              <button
                type="button"
                className={cn(
                  'rounded-xl h-10 w-14 text-sm font-medium transition-all',
                  !isPM && 'neu-slot-selected',
                  isPM && 'neu-slot text-text-secondary',
                )}
                onClick={() => setIsPM(false)}
              >
                {isRtl ? 'ص' : 'AM'}
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-xl h-10 w-14 text-sm font-medium transition-all',
                  isPM && 'neu-slot-selected',
                  !isPM && 'neu-slot text-text-secondary',
                )}
                onClick={() => setIsPM(true)}
              >
                {isRtl ? 'م' : 'PM'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="neu-btn flex-1 rounded-xl py-2.5 text-sm font-medium text-text-secondary"
              onClick={() => setOpen(false)}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="neu-btn-primary flex-1 rounded-xl py-2.5 text-sm font-medium"
              onClick={() => commitTime(hour12, minute, isPM)}
            >
              {isRtl ? 'تأكيد' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger pr-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
