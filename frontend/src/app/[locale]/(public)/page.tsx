import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export default function LandingPage() {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="neu-card max-w-lg w-full p-10 text-center space-y-8">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
            B
          </div>
          <h1 className="text-3xl font-bold text-text-primary">
            {t('common.title')}
          </h1>
          <p className="text-text-secondary leading-relaxed">
            {t('common.welcome')}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-text-secondary font-medium">
            {t('common.owner_entry')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:px-8">
                {t('auth.login')}
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:px-8">
                {t('auth.register')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-text-muted" />
          <span className="text-xs text-text-secondary">{t('common.or')}</span>
          <div className="flex-1 h-px bg-text-muted" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-text-secondary font-medium">
            {t('common.customer_entry')}
          </p>
          <Link href="/find-business">
            <Button variant="primary" className="w-full">
              {t('auth.book_now')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
