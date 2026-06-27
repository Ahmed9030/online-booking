'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function LoginPage() {
  const t = useTranslations()
  const login = useLogin()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="neu-card w-full max-w-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
          B
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {t('auth.login')}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit((data) => login.mutate(data))} className="space-y-4">
        <Input
          placeholder={t('auth.email_or_username')}
          {...form.register('email_or_username')}
          error={form.formState.errors.email_or_username?.message}
        />

        <Input
          type="password"
          placeholder={t('auth.password')}
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11"
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

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.no_account')}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  )
}
