'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

/**
 * Login page for owners and staff with email/username and password form.
 * Handles form validation, loading state, and role-based post-login
 * routing via the useLogin hook (which also manages error toasts).
 *
 * @returns The login page component.
 */
export default function LoginPage() {
  const t = useTranslations()
  const login = useLogin()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email_or_username: '',
      password: '',
    },
  })

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('auth.login')}
          </h1>
          <p className="text-text-secondary">
            {t('auth.login_description')}
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit((data) => login.mutate(data))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('auth.email_or_username')}
            </label>
            <Input
              placeholder="البريد الإلكتروني أو اسم المستخدم"
              {...form.register('email_or_username')}
              error={form.formState.errors.email_or_username?.message}
              disabled={login.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('auth.password')}
            </label>
            <Input
              type="password"
              placeholder="كلمة المرور"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
              disabled={login.isPending}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary">
              <input type="checkbox" className="w-4 h-4" />
              {t('auth.remember_me')}
            </label>
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              {t('auth.forgot_password')}
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('common.loading')}
              </span>
            ) : (
              t('auth.login')
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-text-muted" />
          <span className="text-text-secondary text-sm">{t('common.or')}</span>
          <div className="flex-1 h-px bg-text-muted" />
        </div>

        <p className="text-center text-text-secondary">
          {t('auth.no_account')}{' '}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.register_now')}
          </Link>
        </p>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg text-center">
          <p className="text-sm text-text-secondary mb-2">
            {t('auth.customer_alternative')}
          </p>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              {t('auth.book_now')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
