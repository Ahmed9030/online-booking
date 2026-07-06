'use client'

/**
 * Usage examples for NeumorphicTimePicker.
 *
 * Example 1: Booking form with react-hook-form
 * Example 2: Working hours editor
 *
 * These are reference implementations — copy the relevant pattern
 * into your actual form/page components.
 */

// ── Example 1: Booking form (react-hook-form + Zod) ──────────
/*
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NeumorphicTimePicker } from '@/components/ui/NeumorphicTimePicker'

const formSchema = z.object({
  date: z.string(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

type FormData = z.infer<typeof formSchema>

export function BookingTimeField() {
  const { setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: '', time: '' },
  })

  const timeValue = watch('time')

  return (
    <NeumorphicTimePicker
      label="موعد الحجز"
      value={timeValue}
      onChange={(t) => setValue('time', t, { shouldValidate: true })}
      error={errors.time?.message}
      minuteStep={5}
    />
  )
}
*/

// ── Example 2: Working hours editor ───────────────────────────
/*
import { useState } from 'react'
import { NeumorphicTimePicker } from '@/components/ui/NeumorphicTimePicker'

interface DayHours {
  start: string | null
  end: string | null
}

export function WorkingHourRow({
  dayLabel,
  hours,
  onChange,
}: {
  dayLabel: string
  hours: DayHours
  onChange: (h: DayHours) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm font-medium text-text-secondary">{dayLabel}</span>
      <NeumorphicTimePicker
        label="بداية"
        value={hours.start}
        onChange={(t) => onChange({ ...hours, start: t })}
        minuteStep={15}
      />
      <span className="text-text-muted">—</span>
      <NeumorphicTimePicker
        label="نهاية"
        value={hours.end}
        onChange={(t) => onChange({ ...hours, end: t })}
        minuteStep={15}
      />
    </div>
  )
}
*/

// ── Example 3: Standalone controlled usage ────────────────────
/*
import { useState } from 'react'
import { NeumorphicTimePicker } from '@/components/ui/NeumorphicTimePicker'

export function StandalonePicker() {
  const [time, setTime] = useState<string | null>('09:00')

  return (
    <NeumorphicTimePicker
      label="وقت البدء"
      value={time}
      onChange={setTime}
      minuteStep={5}
    />
  )
}
*/

// Placeholder — this file is documentation only.
export default function TimePickerExamples() {
  return null
}
