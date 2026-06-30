'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { useBookingStore } from '@/store/booking'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, BookingFormData } from '@/lib/validations'
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking'
import { Input } from '@/components/ui/Input'

/**
 * Confirmation page where the user reviews their booking details
 * and enters their name/phone before submitting.
 */
export default function ConfirmPage() {
  const t = useTranslations()
  const router = useRouter()
  const { businessSlug } = useParams()
  const bookingStore = useBookingStore()
  const createBooking = useCreateBooking()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: bookingStore.branch?.id || '',
      service_id: bookingStore.service?.id || '',
      staff_id: bookingStore.staff?.id || null,
      customer_name: bookingStore.customerName,
      customer_phone: bookingStore.customerPhone,
      date: bookingStore.selectedDate || '',
      time: bookingStore.selectedSlot?.starts_at
        ? (() => {
            const d = new Date(bookingStore.selectedSlot.starts_at)
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          })()
        : '',
    },
  })

  const onSubmit = async (data: BookingFormData) => {
    const startTime = bookingStore.selectedSlot?.starts_at
      ? new Date(bookingStore.selectedSlot.starts_at).toISOString()
      : `${data.date}T${data.time}:00`
    const endTime = bookingStore.selectedSlot?.ends_at
      ? new Date(bookingStore.selectedSlot.ends_at).toISOString()
      : `${data.date}T${data.time}:00`

    await createBooking.mutateAsync({
      branch_id: data.branch_id,
      service_id: data.service_id,
      staff_id: data.staff_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      starts_at: startTime,
      ends_at: endTime,
    })

    router.push(`/book/${businessSlug}/${bookingStore.branch?.slug}/success`)
  }

  if (!bookingStore.branch || !bookingStore.service) {
    router.push('/')
    return null
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('booking.confirm')}</h1>

      <div className="neu-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="text-left">
            <div className="font-semibold text-text-primary">{bookingStore.service.name}</div>
            <div className="text-sm text-text-secondary mt-1">
              {bookingStore.branch.name}
            </div>
          </div>
          <div className="text-sm text-text-secondary">
            {bookingStore.service.duration_minutes} دقيقة
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('booking.customer_name')}
            placeholder="أدخل اسمك"
            {...form.register('customer_name')}
            error={form.formState.errors.customer_name?.message}
          />
          <Input
            label={t('booking.customer_phone')}
            placeholder="أدخل رقم الهاتف"
            {...form.register('customer_phone')}
            error={form.formState.errors.customer_phone?.message}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-base"
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('common.loading')}
              </span>
            ) : (
              t('booking.confirm_booking')
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
