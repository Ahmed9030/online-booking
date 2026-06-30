import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

/**
 * Internationalization routing configuration for next-intl.
 * Supports Arabic and English with Arabic as the default locale.
 * All routes require an explicit locale prefix.
 */
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
