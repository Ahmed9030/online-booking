'use client'

import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'

export function useResolvedLocale(): string {
  const params = useParams()
  const localeHook = useLocale()
  return (params.locale as string) || localeHook || 'ar'
}
