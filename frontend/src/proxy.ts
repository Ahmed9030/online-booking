import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

/**
 * Next.js 16 proxy middleware (replaces middleware.ts) that handles locale routing
 * and protects authenticated routes. If the incoming request path does not contain
 * a supported locale prefix, it redirects to the default locale (Arabic).
 * Protected routes (/dashboard, /staff, /admin, /my-bookings) require a valid
 * auth_token cookie; unauthorized requests are redirected to the login page.
 *
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse either passing through or redirecting as needed.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (!pathnameHasLocale) {
    request.nextUrl.pathname = `/${routing.defaultLocale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  const locale = routing.locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  ) || routing.defaultLocale

  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '')

  const protectedPaths = [
    '/dashboard',
    '/staff',
    '/admin',
    '/my-bookings',
  ]

  const isProtectedPath = protectedPaths.some((path) =>
    pathWithoutLocale.startsWith(path),
  )

  if (isProtectedPath && !token) {
    request.nextUrl.pathname = `/${locale}/login`
    return NextResponse.redirect(request.nextUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
