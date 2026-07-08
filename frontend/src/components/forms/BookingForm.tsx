'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, BookingFormData } from '@/lib/validations'
import { useBookingStore } from '@/store/booking'
import { useShallow } from 'zustand/react/shallow'
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { Branch, Service } from '@/types'

/** Props for the BookingForm component. */
interface BookingFormProps {
  /** Branch data to hydrate into the booking store */
  branch: Branch
  /** Array of services available for booking */
  services: Service[]
}

/**
 * Complete booking form that orchestrates the multi-step booking flow.
 * Renders the appropriate step component (ServiceSelector or form)
 * based on the current step in the booking store, and handles form submission.
 */
export function BookingForm({ branch, services }: BookingFormProps) {
  const t = useTranslations()
  useEffect(() => {
    useBookingStore.setState({
      branch,
      step: 1,
      service: null,
      staff: null,
      selectedDate: null,
      selectedSlot: null,
      availableSlots: [],
      customerName: '',
      customerPhone: '',
    })
  }, [branch])
  const step = useBookingStore((s) => s.step)
  const basket = useBookingStore(
    useShallow((s) => ({
      branch: s.branch,
      service: s.service,
      staff: s.staff,
      selectedSlot: s.selectedSlot,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
    })),
  )
  const createBooking = useCreateBooking()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: basket.branch?.id || '',
      service_id: basket.service?.id || '',
      staff_id: basket.staff?.id || null,
      customer_name: basket.customerName,
      customer_phone: basket.customerPhone,
      date: basket.selectedSlot?.starts_at
        ? new Date(basket.selectedSlot.starts_at).toISOString().split('T')[0]
        : '',
      time: basket.selectedSlot?.starts_at
        ? (() => {
            const d = new Date(basket.selectedSlot.starts_at)
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          })()
        : '',
    },
  })
  const { reset } = form

  useEffect(() => {
    reset({
      branch_id: basket.branch?.id || '',
      service_id: basket.service?.id || '',
      staff_id: basket.staff?.id || null,
      customer_name: basket.customerName,
      customer_phone: basket.customerPhone,
      date: basket.selectedSlot?.starts_at
        ? new Date(basket.selectedSlot.starts_at).toISOString().split('T')[0]
        : '',
      time: basket.selectedSlot?.starts_at
        ? (() => {
            const d = new Date(basket.selectedSlot.starts_at)
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          })()
        : '',
    })
  }, [basket, reset])

  const onSubmit = async (data: BookingFormData) => {
    const slot = basket.selectedSlot
    if (!basket.branch?.id || !basket.service?.id) return

    const starts_at = slot?.starts_at || `${data.date}T${data.time}:00`
    const ends_at = slot?.ends_at || (() => {
      const start = new Date(starts_at)
      start.setMinutes(start.getMinutes() + (basket.service?.duration_minutes || 30))
      const sy = String(start.getFullYear())
      const sm = String(start.getMonth() + 1).padStart(2, '0')
      const sd = String(start.getDate()).padStart(2, '0')
      const eh = String(start.getHours()).padStart(2, '0')
      const em = String(start.getMinutes()).padStart(2, '0')
      return `${sy}-${sm}-${sd}T${eh}:${em}:00`
    })()

    await createBooking.mutateAsync({
      branch_id: basket.branch.id,
      service_id: basket.service.id,
      staff_id: basket.staff?.id || null,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      starts_at,
      ends_at,
    })
  }

  if (step === 1) {
    return <ServiceSelector services={services} />
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('booking.customer_name')}
        placeholder={t('booking.enter_details')}
        {...form.register('customer_name')}
        error={form.formState.errors.customer_name?.message}
      />
      <Input
        label={t('booking.customer_phone')}
        placeholder={t('booking.enter_phone')}
        {...form.register('customer_phone')}
        error={form.formState.errors.customer_phone?.message}
      />
      <Button type="submit" variant="primary" className="w-full">
        {t('common.confirm')}
      </Button>
    </form>
  )
}
