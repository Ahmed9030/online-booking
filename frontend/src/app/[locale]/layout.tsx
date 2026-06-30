import { ReactNode } from 'react'
import { Cairo, Tajawal } from 'next/font/google'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toast } from '@/components/ui/Toast'
import '../globals.css'

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  display: 'swap',
})

interface RootLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

/**
 * Root layout component that sets up internationalization, RTL/LTR direction,
 * custom fonts (Cairo + Tajawal), and TanStack Query provider.
 *
 * @param children - The child components to render within the layout.
 * @param params - Route parameters containing the locale.
 */
export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params
  const messages = await getMessages()
  const isArabic = locale === 'ar'

  return (
    <html
      lang={locale}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="bg-bg text-text-primary"
        style={{ backgroundColor: 'var(--bg, #eef1f5)' }}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            {children}
            <Toast />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
