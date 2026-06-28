'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function RegisterPage() {
  const t = useTranslations()
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    console.log(data)
  }

  return (
    <div className="neu-card w-full max-w-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
          B
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {t('auth.register')}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          placeholder={t('auth.name') || 'الاسم الكامل'}
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
        <Input
          placeholder={t('auth.email') || 'البريد الإلكتروني'}
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <Input
          type="password"
          placeholder={t('auth.password')}
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />
        <Input
          type="password"
          placeholder={t('auth.password_confirmation') || 'تأكيد كلمة المرور'}
          {...form.register('password_confirmation')}
          error={form.formState.errors.password_confirmation?.message}
        />
        <Input
          placeholder={t('auth.business_name') || 'اسم المشروع'}
          {...form.register('business_name')}
          error={form.formState.errors.business_name?.message}
        />
        <Input
          placeholder={t('auth.branch_name') || 'اسم الفرع'}
          {...form.register('branch_name')}
          error={form.formState.errors.branch_name?.message}
        />
        <Input
          placeholder={t('auth.branch_address') || 'عنوان الفرع'}
          {...form.register('branch_address')}
          error={form.formState.errors.branch_address?.message}
        />

        <Button type="submit" variant="primary" className="w-full h-11">
          {t('auth.register')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.has_account') || 'لديك حساب بالفعل؟'}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}
