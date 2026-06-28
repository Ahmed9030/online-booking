'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, BookingFormData } from '@/lib/validations'
import { useBookingStore } from '@/store/booking'
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { Service } from '@/types'

interface BookingFormProps {
  services: Service[]
}

export function BookingForm({ services }: BookingFormProps) {
  const t = useTranslations()
  const step = useBookingStore((s) => s.step)
  const basket = useBookingStore((s) => ({
    branch: s.branch,
    service: s.service,
    staff: s.staff,
    selectedSlot: s.selectedSlot,
    customerName: s.customerName,
    customerPhone: s.customerPhone,
  }))
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
        ? new Date(basket.selectedSlot.starts_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '',
    },
  })

  const onSubmit = async (data: BookingFormData) => {
    const starts_at = basket.selectedSlot?.starts_at || `${data.date}T${data.time}:00`
    const ends_at = basket.selectedSlot?.ends_at || `${data.date}T${data.time}:00`

    await createBooking.mutateAsync({
      branch_id: data.branch_id,
      service_id: data.service_id,
      staff_id: data.staff_id,
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
      <Button type="submit" variant="primary" className="w-full">
        {t('common.confirm')}
      </Button>
    </form>
  )
}
