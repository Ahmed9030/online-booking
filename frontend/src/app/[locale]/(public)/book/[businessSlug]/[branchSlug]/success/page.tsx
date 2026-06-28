'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export default function SuccessPage() {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="neu-card max-w-sm w-full p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto">
          ✓
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text-primary">
            {t('booking.success_title')}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t('booking.success_message')}
          </p>
        </div>

        <Link href="/">
          <Button variant="primary" className="w-full">
            {t('booking.back_to_home')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
