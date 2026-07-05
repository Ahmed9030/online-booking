'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormData } from '@/lib/validations'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useState } from 'react'

/**
 * Owner registration page with a 2-step form flow.
 * Step 1 collects account information (name, email, password).
 * Step 2 collects business information (business name, branch name,
 * address, city). Uses the useRegister hook for API submission.
 *
 * @returns The registration page component.
 */
export default function RegisterPage() {
  const t = useTranslations()
  const register = useRegister()
  const [step, setStep] = useState(1)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      business_name: '',
      branch_name: '',
      branch_address: '',
      city: 'Cairo',
    },
  })

  const handleNextStep = async () => {
    const isValid = await form.trigger(['name', 'email', 'password', 'password_confirmation'])
    if (isValid) {
      setStep(2)
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    register.mutate(data)
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8 relative">
        <Link
          href="/"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl neu-btn flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
          aria-label="Back to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('auth.create_account')}
          </h1>
          <p className="text-text-secondary text-sm">
            {t('auth.register_description')}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <div
              className={`h-1 w-8 rounded-full ${
                step === 1 ? 'bg-primary' : 'bg-text-muted'
              }`}
            />
            <div
              className={`h-1 w-8 rounded-full ${
                step === 2 ? 'bg-primary' : 'bg-text-muted'
              }`}
            />
          </div>
        </div>

        <form onSubmit={step === 2 ? form.handleSubmit(onSubmit) : (e) => e.preventDefault()} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.full_name')} *
                </label>
                <Input
                  placeholder="أحمد محمد"
                  {...form.register('name')}
                  error={form.formState.errors.name?.message}
                  disabled={register.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.email')} *
                </label>
                <Input
                  type="email"
                  placeholder="ahmed@example.com"
                  {...form.register('email')}
                  error={form.formState.errors.email?.message}
                  disabled={register.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.password')} *
                </label>
                <Input
                  type="password"
                  placeholder="كلمة مرور قوية"
                  {...form.register('password')}
                  error={form.formState.errors.password?.message}
                  disabled={register.isPending}
                />
                <p className="text-xs text-text-secondary mt-1">
                  {t('auth.password_requirements')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.password_confirmation')} *
                </label>
                <Input
                  type="password"
                  placeholder="تأكيد كلمة المرور"
                  {...form.register('password_confirmation')}
                  error={form.formState.errors.password_confirmation?.message}
                  disabled={register.isPending}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.barbershop_name')} *
                </label>
                <Input
                  placeholder="حلاق أحمد"
                  {...form.register('business_name')}
                  error={form.formState.errors.business_name?.message}
                  disabled={register.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.main_branch_name')} *
                </label>
                <Input
                  placeholder="الفرع الرئيسي"
                  {...form.register('branch_name')}
                  error={form.formState.errors.branch_name?.message}
                  disabled={register.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.branch_address')} *
                </label>
                <Input
                  placeholder="123 شارع الزمالك، القاهرة"
                  {...form.register('branch_address')}
                  error={form.formState.errors.branch_address?.message}
                  disabled={register.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t('auth.city')} *
                </label>
                <select
                  className="w-full neu-input flex h-11 rounded-xl bg-surface px-4 py-2 text-sm text-text-primary focus:outline-none"
                  {...form.register('city')}
                >
                  <option value="Cairo">القاهرة</option>
                  <option value="Giza">الجيزة</option>
                  <option value="Alex">الإسكندرية</option>
                  <option value="Helwan">حلوان</option>
                  <option value="6October">6 أكتوبر</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            {step === 2 && (
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={register.isPending}
              >
                {t('common.back')}
              </Button>
            )}

            {step === 1 ? (
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={handleNextStep}
                disabled={register.isPending}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.create_account')
                )}
              </Button>
            )}
          </div>
        </form>

        <p className="text-center text-text-secondary text-sm mt-6">
          {t('auth.already_have_account')}{' '}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
