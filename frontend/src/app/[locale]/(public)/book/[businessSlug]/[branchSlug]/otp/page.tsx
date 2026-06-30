'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  sendOtpSchema,
  verifyOtpSchema,
  SendOtpFormData,
  VerifyOtpFormData,
} from '@/lib/validations'
import { useSendOtp, useVerifyOtp } from '@/features/auth/hooks/useOtp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { useBookingStore } from '@/store/booking'
import { useRouter, useParams } from 'next/navigation'

type Step = 'phone' | 'verify'

/**
 * Customer OTP verification page for the booking flow.
 * Step 1 collects the phone number and sends an OTP via WhatsApp.
 * Step 2 verifies the 6-digit code with a countdown timer.
 * On successful verification, stores the auth token and redirects
 * to the checkout or my-bookings page.
 *
 * @returns The OTP verification page component.
 */
export default function OtpPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()

  const sendForm = useForm<SendOtpFormData>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { phone: '' },
  })

  const verifyForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { phone: '', code: '' },
  })

  const onSendOtp = async (data: SendOtpFormData) => {
    try {
      await sendOtp.mutateAsync(data.phone)
      setPhone(data.phone)
      setStep('verify')
      setTimeRemaining(300)

      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      // Error handled by hook
    }
  }

  const onVerifyOtp = async (data: VerifyOtpFormData) => {
    try {
      await verifyOtp.mutateAsync({
        phone: data.phone,
        code: data.code,
      })

      const bookingStep = useBookingStore.getState().step
      if (bookingStep === 4) {
        const businessSlug = params.businessSlug as string
        const branchSlug = params.branchSlug as string
        router.push(`/ar/book/${businessSlug}/${branchSlug}/confirm`)
      } else {
        router.push('/ar/my-bookings')
      }
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('booking.verify_phone')}
          </h1>
          <p className="text-text-secondary">
            {t('booking.otp_description')}
          </p>
        </div>

        {step === 'phone' && (
          <form
            onSubmit={sendForm.handleSubmit(onSendOtp)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t('common.phone')} *
              </label>
              <Input
                type="tel"
                placeholder="+201001234567"
                {...sendForm.register('phone')}
                error={sendForm.formState.errors.phone?.message}
                disabled={sendOtp.isPending}
              />
              <p className="text-xs text-text-secondary mt-2">
                {t('booking.otp_via_whatsapp')}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={sendOtp.isPending}
            >
              {sendOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('common.sending')}
                </span>
              ) : (
                t('booking.send_otp')
              )}
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <form
            onSubmit={verifyForm.handleSubmit(onVerifyOtp)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t('booking.verification_code')} *
              </label>
              <Input
                placeholder="000000"
                maxLength={6}
                {...verifyForm.register('code')}
                error={verifyForm.formState.errors.code?.message}
                disabled={verifyOtp.isPending}
                className="text-center text-2xl tracking-widest"
              />
              <input
                type="hidden"
                {...verifyForm.register('phone')}
                value={phone}
              />
              <p className="text-xs text-text-secondary mt-2">
                {timeRemaining > 0 ? (
                  <>
                    {t('booking.otp_expires_in')} {Math.floor(timeRemaining / 60)}:
                    {String(timeRemaining % 60).padStart(2, '0')}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      sendForm.reset()
                    }}
                    className="text-primary hover:underline"
                  >
                    {t('booking.resend_otp')}
                  </button>
                )}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={verifyOtp.isPending || timeRemaining === 0}
            >
              {verifyOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('common.verifying')}
                </span>
              ) : (
                t('booking.verify')
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={() => {
                setStep('phone')
                setPhone('')
                verifyForm.reset()
              }}
              disabled={verifyOtp.isPending}
            >
              {t('common.back')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
