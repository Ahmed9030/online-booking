'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useCreateBooking } from '@/features/bookings/hooks/useDashboardBookings'
import { useBranchesList } from '@/features/branches/hooks/useBranches'
import { useServicesList } from '@/features/services/hooks/useServices'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'
import type { BlockedSlot } from '@/components/ui/TimePicker'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { api } from '@/services/api'
import type { Booking } from '@/types'

interface CreateBookingFormData {
  customer_name: string
  customer_phone: string
  branch_id: string
  service_id: string
  staff_id: string
}

interface SelectFieldProps {
  label: string
  error?: string | null
  children: React.ReactNode
  [key: string]: unknown
}

function SelectField({ label, error, children, ...props }: SelectFieldProps) {
  const t = useTranslations()
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-secondary">{label}</label>
      <select
        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-text-primary appearance-none cursor-pointer transition-colors hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left 12px center',
          paddingRight: '12px',
          paddingLeft: '32px',
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-danger pr-1" role="alert">{t(error)}</p>
      )}
    </div>
  )
}

function extractLocalTime(isoString: string): string {
  const d = new Date(isoString)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function extractLocalDate(isoString: string): string {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CreateBookingPage() {
  const t = useTranslations()
  const router = useRouter()
  const createBooking = useCreateBooking()
  const { data: branchesData } = useBranchesList()
  const { data: servicesData } = useServicesList()
  const { data: staffData } = useStaffList()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CreateBookingFormData>()

  const selectedBranchId = watch('branch_id')
  const selectedStaffId = watch('staff_id')

  const [startDate, setStartDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)

  const normalizedStartDate = useMemo(
    () =>
      startDate
        ? new Date(startDate + 'T12:00:00').toISOString().split('T')[0]
        : null,
    [startDate],
  )

  const normalizedEndDate = useMemo(
    () =>
      endDate
        ? new Date(endDate + 'T12:00:00').toISOString().split('T')[0]
        : null,
    [endDate],
  )

  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const selectedBranch = branchesData?.data.find(
    (b) => b.id === selectedBranchId,
  )

  const todayWeekday = startDate
    ? new Date(startDate + 'T00:00:00').getDay()
    : -1

  const branchHours = selectedBranch?.working_hours?.find(
    (wh) => wh.weekday === todayWeekday,
  )

  const openTime = branchHours?.open_time ?? '08:00'
  const closeTime = branchHours?.close_time ?? '20:00'

  const { data: existingBookings } = useQuery({
    queryKey: [
      'bookings-date',
      startDate,
      selectedBranchId,
      selectedStaffId,
    ],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 200 }
      if (selectedBranchId) params.branch_id = selectedBranchId
      if (selectedStaffId) params.staff_id = selectedStaffId
      const res = await api.get('/owner/bookings', { params })
      return res.data.data as Booking[]
    },
    enabled: !!startDate,
  })

  const blockedSlots: BlockedSlot[] = useMemo(() => {
    if (!existingBookings || !startDate) return []

    const directlyOverlapping = existingBookings
      .filter((b) => {
        const bookingLocalDate = extractLocalDate(b.starts_at)
        const matchesDate = bookingLocalDate === startDate
        const matchesStatus =
          b.status === 'confirmed' || b.status === 'completed'
        return matchesDate && matchesStatus
      })
      .map((b) => ({
        start: extractLocalTime(b.starts_at),
        end: extractLocalTime(b.ends_at),
      }))

    return directlyOverlapping
  }, [existingBookings, startDate])

  const filteredServices = servicesData?.data.filter(
    (s) => !selectedBranchId || s.branch_id === selectedBranchId,
  )
  const filteredStaff = staffData?.data.filter(
    (s) => !selectedBranchId || s.branch_id === selectedBranchId,
  )

  function formatLocalDateTime(dateStr: string, timeStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const [hh, mm] = timeStr.split(':').map(Number)
    const date = new Date(y, m - 1, d, hh, mm)
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const abs = Math.abs(offset)
    const tz = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
    return `${dateStr}T${timeStr}:00${tz}`
  }

  const onSubmit = async (data: CreateBookingFormData) => {
    setSubmitted(true)
    setServerError(null)
    if (!startDate || !startTime || !endDate || !endTime) return

    try {
      await createBooking.mutateAsync({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        branch_id: data.branch_id,
        service_id: data.service_id,
        staff_id: data.staff_id || null,
        starts_at: formatLocalDateTime(startDate, startTime),
        ends_at: formatLocalDateTime(endDate, endTime),
      })
      reset()
      setStartDate(null)
      setStartTime(null)
      setEndDate(null)
      setEndTime(null)
      setSubmitted(false)
      router.push('/dashboard/bookings')
    } catch (e: unknown) {
      setSubmitted(false)
      if (e && typeof e === 'object' && 'response' in e) {
        const err = e as { response: { data: { message?: string; errors?: Record<string, string[]> } } }
        const msg = err.response.data?.message
        const errs = err.response.data?.errors
        if (errs) {
          const flat = Object.entries(errs).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' | ')
          setServerError(flat)
        } else if (msg) {
          setServerError(msg)
        }
      }
    }
  }

  const startDateError = submitted && !startDate ? 'validation.required' : null
  const startTimeError = submitted && !startTime ? 'validation.required' : null
  const endDateError = submitted && !endDate ? 'validation.required' : null
  const endTimeError = submitted && !endTime ? 'validation.required' : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          {t('common.create')} {t('nav.bookings')}
        </h1>
      </div>

      <div className="neu-card p-6 lg:p-8 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('booking.customer_name')}
              placeholder={t('booking.customer_name')}
              {...register('customer_name', { required: true })}
              error={errors.customer_name ? 'validation.required' : null}
            />
            <Input
              label={t('booking.customer_phone')}
              placeholder={t('booking.customer_phone')}
              {...register('customer_phone', { required: true })}
              error={errors.customer_phone ? 'validation.required' : null}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label={t('nav.branches')}
              error={errors.branch_id ? 'validation.required' : null}
              {...register('branch_id', { required: true })}
            >
              <option value="">{t('common.select_branch')}</option>
              {branchesData?.data.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </SelectField>

            <SelectField
              label={t('nav.services')}
              error={errors.service_id ? 'validation.required' : null}
              {...register('service_id', { required: true })}
            >
              <option value="">{t('booking.select_service')}</option>
              {filteredServices?.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </SelectField>

            <SelectField
              label={t('nav.staff')}
              {...register('staff_id')}
            >
              <option value="">{t('booking.any_available')}</option>
              {filteredStaff?.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </SelectField>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              {t('common.date')}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label={t('booking.select_date')}
                  value={startDate}
                  onChange={setStartDate}
                  error={startDateError}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                <TimePicker
                  label={t('booking.select_time')}
                  value={startTime}
                  onChange={(v) => setStartTime(v)}
                  error={startTimeError}
                  blockedSlots={blockedSlots}
                  openTime={openTime}
                  closeTime={closeTime}
                  selectedDate={normalizedStartDate}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label={t('common.ends_at')}
                  value={endDate}
                  onChange={setEndDate}
                  error={endDateError}
                  minDate={startDate || new Date().toISOString().split('T')[0]}
                />
                <TimePicker
                  label={t('common.end_time')}
                  value={endTime}
                  onChange={(v) => setEndTime(v)}
                  error={endTimeError}
                  blockedSlots={blockedSlots}
                  openTime={openTime}
                  closeTime={closeTime}
                  selectedDate={normalizedEndDate}
                />
              </div>
            </div>
          </div>

          {serverError && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger" role="alert">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 h-11"
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? t('common.sending') : t('common.save')}
            </Button>
            <Button
              type="button"
              variant="default"
              className="flex-1 h-11"
              onClick={() => router.push('/dashboard/bookings')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
