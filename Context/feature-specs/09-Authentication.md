# Authentication & Registration Specification
# Booking SaaS — Barbershop Appointment Platform

> Complete specification for login and registration flows for all user types.
> Covers forms, API calls, state management, routing, and error handling.

---

## User Types & Authentication Methods

| User Type | Auth Method | Register | Login Route | Dashboard Route | Notes |
|-----------|-------------|----------|-------------|-----------------|-------|
| **Owner** | Email + Password | Yes (self-signup) | `/ar/auth/register` | `/ar/dashboard` | Creates business |
| **Staff** | Email + Password | No (created by owner) | `/ar/auth/login` | `/ar/staff/schedule` | Limited access |
| **Customer** | Phone + OTP | Yes (auto on booking) | Auto in booking | `/ar/my-bookings` | No password |
| **Admin** | Email + Password | No (DB seeded) | `/ar/admin/login` | `/ar/admin/overview` | Full access |

---

## Part 1: Authentication Flow Diagrams

### Flow 1: Owner Registration + Login

```
┌─────────────────────────────────────────────────────────┐
│         OWNER AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────┘

REGISTRATION:
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  /register   │ ──→ │ Fill Form:       │ ──→ │ POST /auth/  │
│  (Public)    │     │ - Name           │     │ register     │
│              │     │ - Email          │     │              │
│              │     │ - Password       │     │ Response:    │
│              │     │ - Business Name  │     │ - user       │
│              │     │ - Branch Name    │     │ - business   │
│              │     │ - Address        │     │ - token      │
│              │     │ - City           │     │              │
│              │     └──────────────────┘     └──────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              │                      │ Store token in       │
│              │                      │ localStorage         │
│              │                      │ Set auth store       │
│              │                      └──────────────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              └──────────────────────→│ Redirect to:         │
│                                      │ /ar/dashboard        │
│                                      └──────────────────────┘

LOGIN:
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  /login      │ ──→ │ Fill Form:       │ ──→ │ POST /auth/  │
│  (Public)    │     │ - Email/Username │     │ login        │
│              │     │ - Password       │     │              │
│              │     └──────────────────┘     │ Response:    │
│              │                              │ - user       │
│              │                              │ - business   │
│              │                              │ - token      │
│              │                              └──────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              └──────────────────────→│ /ar/dashboard        │
│                                      └──────────────────────┘
```

### Flow 2: Customer OTP Registration + Login

```
┌─────────────────────────────────────────────────────────┐
│       CUSTOMER OTP AUTHENTICATION FLOW                   │
└─────────────────────────────────────────────────────────┘

DURING BOOKING:
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Book Now    │ ──→ │ Enter Name +     │ ──→ │ POST /auth/  │
│  (Public)    │     │ Phone Number     │     │ otp/send     │
│              │     └──────────────────┘     └──────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              │                      │ Send OTP via WhatsApp│
│              │                      │ Show verification    │
│              │                      │ code input           │
│              │                      └──────────────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              │                      │ POST /auth/otp/      │
│              │                      │ verify               │
│              │                      │                      │
│              │                      │ Response: token      │
│              │                      └──────────────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              └──────────────────────→│ Complete booking     │
│                                      │ auto-create customer │
│                                      │ Redirect to:         │
│                                      │ /ar/my-bookings      │
│                                      └──────────────────────┘

LATER LOGIN:
Same OTP flow - no password needed
```

### Flow 3: Staff Login

```
┌─────────────────────────────────────────────────────────┐
│            STAFF LOGIN FLOW                              │
└─────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  /login      │ ──→ │ Fill Form:       │ ──→ │ POST /auth/  │
│  (Public)    │     │ - Email/Username │     │ login        │
│              │     │ - Password       │     │              │
│              │     │                  │     │ Response:    │
│              │     └──────────────────┘     │ - user       │
│              │                              │ - token      │
│              │                              │ (no business)│
│              │                              └──────────────┘
│              │                                     │
│              │                                     ↓
│              │                      ┌──────────────────────┐
│              └──────────────────────→│ Check role: staff    │
│                                      │ Redirect to:         │
│                                      │ /ar/staff/schedule   │
│                                      └──────────────────────┘
```

---

## Part 2: Backend API Endpoints (Review from Phase 3)

### Endpoint 1: Owner Registration

```
POST /api/v1/auth/register

Request:
{
  "name": "Ahmed",
  "email": "ahmed@barbershop.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "business_name": "Ahmed's Barbershop",
  "branch_name": "Main Branch",
  "branch_address": "123 Zamalek Street, Cairo",
  "city": "Cairo"
}

Response (201):
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ahmed",
      "email": "ahmed@barbershop.com",
      "role": "owner",
      "business_id": "uuid"
    },
    "business": {
      "id": "uuid",
      "name": "Ahmed's Barbershop",
      "slug": "ahmeds-barbershop-abc123",
      "subscription_status": "trial",
      "subscription_expires_at": "2026-07-24"
    },
    "token": "plainTextToken..."
  },
  "message": "Account created successfully"
}

Error (422):
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email already exists"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Endpoint 2: Owner/Staff Login

```
POST /api/v1/auth/login

Request:
{
  "email_or_username": "ahmed@barbershop.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ahmed",
      "email": "ahmed@barbershop.com",
      "role": "owner",
      "business_id": "uuid"
    },
    "token": "plainTextToken..."
  },
  "message": "Logged in successfully"
}

Error (401):
{
  "message": "Invalid credentials"
}

Error (403):
{
  "message": "This account has been deactivated"
}
```

### Endpoint 3: Customer OTP - Send

```
POST /api/v1/auth/otp/send

Request:
{
  "phone": "+201001234567"
}

Response (200):
{
  "message": "OTP sent to your phone. Valid for 5 minutes."
}

Error (429):
{
  "message": "Too many OTP requests. Please try again later."
}
```

### Endpoint 4: Customer OTP - Verify

```
POST /api/v1/auth/otp/verify

Request:
{
  "phone": "+201001234567",
  "code": "123456"
}

Response (200):
{
  "data": {
    "token": "plainTextToken...",
    "phone": "+201001234567"
  },
  "message": "OTP verified successfully"
}

Error (422):
{
  "message": "Invalid or expired OTP"
}
```

### Endpoint 5: Logout

```
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## Part 3: Frontend Pages & Components

### Page 1: `src/app/[locale]/(auth)/login/page.tsx`

Unified login page for Owner/Staff:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useUiStore } from '@/store/ui'

export default function LoginPage() {
  const t = useTranslations()
  const login = useLogin()
  const showToast = useUiStore((s) => s.showToast)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email_or_username: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data)
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'فشل تسجيل الدخول',
        'error',
      )
    }
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('auth.login')}
          </h1>
          <p className="text-text-secondary">
            {t('auth.login_description')}
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Email or Username */}
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

          {/* Password */}
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary">
              <input type="checkbox" className="w-4 h-4" />
              {t('auth.remember_me')}
            </label>
            <Link
              href="/ar/auth/forgot-password"
              className="text-primary hover:underline"
            >
              {t('auth.forgot_password')}
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                {t('common.loading')}
              </span>
            ) : (
              t('auth.login')
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-text-muted" />
          <span className="text-text-secondary text-sm">{t('common.or')}</span>
          <div className="flex-1 h-px bg-text-muted" />
        </div>

        {/* Register Link */}
        <p className="text-center text-text-secondary">
          {t('auth.no_account')}{' '}
          <Link
            href="/ar/auth/register"
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.register_now')}
          </Link>
        </p>

        {/* Customer Login Alternative */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg text-center">
          <p className="text-sm text-text-secondary mb-2">
            {t('auth.customer_alternative')}
          </p>
          <Link href="/ar/book/any-barbershop">
            <Button variant="ghost" className="w-full">
              {t('auth.book_now')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### Page 2: `src/app/[locale]/(auth)/register/page.tsx`

Owner registration:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormData } from '@/lib/validations'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { useUiStore } from '@/store/ui'

export default function RegisterPage() {
  const t = useTranslations()
  const register = useRegister()
  const [step, setStep] = useState(1) // 1: Account, 2: Business
  const showToast = useUiStore((s) => s.showToast)

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

  const onSubmit = async (data: RegisterFormData) => {
    if (step === 1) {
      // Validate account fields only
      const isValid = await form.trigger(['name', 'email', 'password', 'password_confirmation'])
      if (isValid) {
        setStep(2)
      }
      return
    }

    // Step 2: Submit all data
    try {
      await register.mutateAsync(data)
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'فشل إنشاء الحساب',
        'error',
      )
    }
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: Account Info */}
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

          {/* Step 2: Business Info */}
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
                  className="w-full neu-input"
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

          {/* Buttons */}
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

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('common.loading')}
                </span>
              ) : step === 1 ? (
                t('common.next')
              ) : (
                t('auth.create_account')
              )}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center text-text-secondary text-sm mt-6">
          {t('auth.already_have_account')}{' '}
          <Link
            href="/ar/auth/login"
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Page 3: `src/app/[locale]/(public)/book/[businessSlug]/[branchSlug]/otp/page.tsx`

Customer OTP verification (during booking):

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  sendOtpSchema,
  verifyOtpSchema,
  SendOtpFormData,
  VerifyOtpFormData,
} from '@/lib/validations'
import { useSendOtp, useVerifyOtp } from '@/features/auth/hooks/useOtp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useBookingStore } from '@/store/booking'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

type Step = 'phone' | 'verify'

export default function OtpPage() {
  const t = useTranslations()
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()

  const sendForm = useForm<SendOtpFormData>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { phone: '' },
  })

  const verifyForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { phone: '', code: '' },
  })

  const onSendOtp = async (data: SendOtpFormData) => {
    try {
      await sendOtp.mutateAsync(data.phone)
      setPhone(data.phone)
      setStep('verify')
      setTimeRemaining(300) // 5 minutes

      // Timer countdown
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      // Error handling by hook
    }
  }

  const onVerifyOtp = async (data: VerifyOtpFormData) => {
    try {
      const response = await verifyOtp.mutateAsync({
        phone: data.phone,
        code: data.code,
      })

      // Set auth store with OTP token
      useAuthStore.setState({
        token: response.data.token,
        user: { phone: response.data.phone, role: 'customer' },
      })

      // Continue booking flow
      const bookingStep = useBookingStore.getState().step
      if (bookingStep === 4) {
        router.push('/ar/checkout')
      }
    } catch (error) {
      // Error handling by hook
    }
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="neu-card w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('booking.verify_phone')}
          </h1>
          <p className="text-text-secondary">
            {t('booking.otp_description')}
          </p>
        </div>

        {/* Step 1: Send OTP */}
        {step === 'phone' && (
          <form
            onSubmit={sendForm.handleSubmit(onSendOtp)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t('common.phone')} *
              </label>
              <Input
                type="tel"
                placeholder="+201001234567"
                {...sendForm.register('phone')}
                error={sendForm.formState.errors.phone?.message}
                disabled={sendOtp.isPending}
              />
              <p className="text-xs text-text-secondary mt-2">
                {t('booking.otp_via_whatsapp')}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={sendOtp.isPending}
            >
              {sendOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('common.sending')}
                </span>
              ) : (
                t('booking.send_otp')
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 'verify' && (
          <form
            onSubmit={verifyForm.handleSubmit(onVerifyOtp)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t('booking.verification_code')} *
              </label>
              <Input
                placeholder="000000"
                maxLength={6}
                {...verifyForm.register('code')}
                error={verifyForm.formState.errors.code?.message}
                disabled={verifyOtp.isPending}
                className="text-center text-2xl tracking-widest"
              />
              <input
                type="hidden"
                {...verifyForm.register('phone')}
                value={phone}
              />
              <p className="text-xs text-text-secondary mt-2">
                {timeRemaining > 0 ? (
                  <>
                    {t('booking.otp_expires_in')} {Math.floor(timeRemaining / 60)}:
                    {String(timeRemaining % 60).padStart(2, '0')}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      sendForm.reset()
                    }}
                    className="text-primary hover:underline"
                  >
                    {t('booking.resend_otp')}
                  </button>
                )}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={verifyOtp.isPending || timeRemaining === 0}
            >
              {verifyOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('common.verifying')}
                </span>
              ) : (
                t('booking.verify')
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={() => {
                setStep('phone')
                setPhone('')
                verifyForm.reset()
              }}
              disabled={verifyOtp.isPending}
            >
              {t('common.back')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
```

---

## Part 4: Custom Hooks with Proper Routing

### Hook 1: `src/features/auth/hooks/useLogin.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { LoginFormData, AuthResponse, User } from '@/types'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui'

export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const setBusiness = useAuthStore((s) => s.setBusiness)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      const user = data.data.user
      const token = data.data.token

      // Store in auth store
      setUser(user)
      setToken(token)

      // Store in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_token', token)

      showToast('تم تسجيل الدخول بنجاح', 'success')

      // Route based on user role
      const routes = {
        owner: '/ar/dashboard',
        staff: '/ar/staff/schedule',
        admin: '/ar/admin/overview',
        customer: '/ar/my-bookings',
      }

      const redirectUrl = routes[user.role as keyof typeof routes] || '/ar'
      router.push(redirectUrl)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        'فشل تسجيل الدخول. حاول مرة أخرى'
      showToast(message, 'error')
    },
  })
}
```

### Hook 2: `src/features/auth/hooks/useRegister.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { RegisterFormData, AuthResponse } from '@/types'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui'

export function useRegister() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const setBusiness = useAuthStore((s) => s.setBusiness)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await api.post<AuthResponse>('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      const user = data.data.user
      const business = data.data.business
      const token = data.data.token

      // Store in auth store
      setUser(user)
      setBusiness(business)
      setToken(token)

      // Store in localStorage
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_business', JSON.stringify(business))
      localStorage.setItem('auth_token', token)

      showToast('تم إنشاء الحساب بنجاح! مرحباً بك', 'success')

      // Redirect owner to dashboard setup
      setTimeout(() => {
        router.push('/ar/dashboard')
      }, 500)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        'فشل إنشاء الحساب. تحقق من البيانات'
      showToast(message, 'error')
    },
  })
}
```

### Hook 3: `src/features/auth/hooks/useOtp.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'

export function useSendOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await api.post('/auth/otp/send', { phone })
      return response.data
    },
    onSuccess: () => {
      showToast('تم إرسال رمز التحقق على واتساب', 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'فشل إرسال الرمز'
      showToast(message, 'error')
    },
  })
}

export function useVerifyOtp() {
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async ({
      phone,
      code,
    }: {
      phone: string
      code: string
    }) => {
      const response = await api.post('/auth/otp/verify', {
        phone,
        code,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      // Store token
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)

      // Create minimal user object
      setUser({
        id: 'temp-customer',
        name: 'Customer',
        phone: data.phone,
        role: 'customer',
      })

      showToast('تم التحقق من الرقم بنجاح', 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'رمز غير صحيح'
      showToast(message, 'error')
    },
  })
}
```

### Hook 4: `src/features/auth/hooks/useLogout.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui'

export function useLogout() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      // Clear auth store
      logout()

      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_business')

      showToast('تم تسجيل الخروج بنجاح', 'success')

      // Redirect to home
      setTimeout(() => {
        router.push('/ar')
      }, 500)
    },
    onError: () => {
      // Force logout even if API call fails
      logout()
      localStorage.removeItem('auth_token')
      router.push('/ar')
    },
  })
}
```

---

## Part 5: Protected Routes & Middleware

### File: `src/proxy.ts`

Route protection with auth check:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  // Check if path is already localized
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (!pathnameHasLocale) {
    request.nextUrl.pathname = `/${routing.defaultLocale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  // Protect dashboard routes
  const protectedPaths = [
    '/ar/dashboard',
    '/ar/staff',
    '/ar/admin',
    '/ar/my-bookings',
  ]

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  )

  if (isProtectedPath && !token) {
    request.nextUrl.pathname = '/ar/auth/login'
    return NextResponse.redirect(request.nextUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Hook: `src/features/auth/hooks/useProtectedRoute.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

interface UseProtectedRouteOptions {
  requiredRole?: 'owner' | 'staff' | 'admin' | 'customer'
}

export function useProtectedRoute(options?: UseProtectedRouteOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    // Check if authenticated
    if (!token) {
      router.push('/ar/auth/login')
      return
    }

    // Check if has required role
    if (options?.requiredRole && user?.role !== options.requiredRole) {
      router.push('/ar/dashboard')
      return
    }
  }, [token, user, router, pathname, options?.requiredRole])

  return { isAuthenticated: !!token, user }
}
```

---

## Part 6: Authentication State Persistence

### File: `src/features/auth/hooks/useAuthPersist.ts`

Restore auth state on page load:

```typescript
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export function useAuthPersist() {
  useEffect(() => {
    // Restore auth state from localStorage
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    const savedBusiness = localStorage.getItem('auth_business')

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        const business = savedBusiness ? JSON.parse(savedBusiness) : null

        useAuthStore.setState({
          token: savedToken,
          user,
          business,
        })
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_business')
      }
    }
  }, [])
}
```

Use in root layout:

```typescript
// src/app/[locale]/layout.tsx
'use client'

import { useAuthPersist } from '@/features/auth/hooks/useAuthPersist'

export default function RootLayout({ children }: any) {
  useAuthPersist()

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

## Part 7: Login Status in TopBar

### Component: `src/components/layout/TopBar.tsx`

Show user & logout button:

```typescript
'use client'

import { useAuthStore } from '@/store/auth'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export function TopBar() {
  const t = useTranslations()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  if (!user) return null

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold">{user.name}</div>
        <div className="text-sm text-text-secondary">{t(`role.${user.role}`)}</div>
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        {t('auth.logout')}
      </Button>
    </div>
  )
}
```

---

## Part 8: Routing Summary

### User Routing After Login

```
LOGIN SUCCESSFUL
│
├─→ Owner/Admin
│   └─→ /ar/dashboard
│
├─→ Staff
│   └─→ /ar/staff/schedule
│
├─→ Customer (via OTP in booking)
│   └─→ /ar/my-bookings
│
└─→ Public (not logged in)
    └─→ /ar/book/[businessSlug]/[branchSlug]
```

### Registration Routing

```
REGISTRATION
│
├─→ Owner Signup
│   ├─ Step 1: Account info
│   ├─ Step 2: Business info
│   └─ Success → /ar/dashboard
│
└─→ Customer (auto on booking)
    └─ OTP verification → /ar/my-bookings
```

---

## Part 9: Translation Keys

Add to `src/i18n/messages/ar.json`:

```json
{
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "create_account": "إنشاء حساب جديد",
    "email_or_username": "البريد الإلكتروني أو اسم المستخدم",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "password_confirmation": "تأكيد كلمة المرور",
    "full_name": "الاسم الكامل",
    "barbershop_name": "اسم المشروع",
    "main_branch_name": "اسم الفرع الرئيسي",
    "branch_address": "عنوان الفرع",
    "city": "المدينة",
    "phone": "رقم الهاتف",
    "password_requirements": "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    "remember_me": "تذكرني",
    "forgot_password": "هل نسيت كلمة المرور؟",
    "no_account": "ليس لديك حساب؟",
    "register_now": "سجل الآن",
    "already_have_account": "هل لديك حساب بالفعل؟",
    "login_description": "قم بتسجيل الدخول للوصول إلى لوحة التحكم",
    "register_description": "أنشئ حسابك الآن وابدأ إدارة حجوزاتك",
    "customer_alternative": "عميل جديد؟",
    "book_now": "احجز الآن",
    "verify_phone": "تحقق من رقم هاتفك",
    "otp_description": "سنرسل لك رمز التحقق على واتساب",
    "otp_via_whatsapp": "سيتم إرسال رمز التحقق على واتساب",
    "send_otp": "إرسال الرمز",
    "verification_code": "رمز التحقق",
    "otp_expires_in": "سينتهي الرمز في",
    "resend_otp": "إعادة إرسال",
    "verify": "تحقق"
  }
}
```

---

## Implementation Checklist

### Pages
- [ ] `(auth)/login/page.tsx` — Owner/Staff login
- [ ] `(auth)/register/page.tsx` — Owner registration (2-step)
- [ ] `(public)/book/[...]/otp/page.tsx` — Customer OTP verification

### Hooks
- [ ] `useLogin()` — with proper routing
- [ ] `useRegister()` — with 2-step form
- [ ] `useSendOtp()` — send OTP
- [ ] `useVerifyOtp()` — verify OTP
- [ ] `useLogout()` — clear auth
- [ ] `useProtectedRoute()` — route protection
- [ ] `useAuthPersist()` — restore on load

### Auth Store Updates
- [ ] `setUser()` — store user
- [ ] `setToken()` — store token
- [ ] `setBusiness()` — store business (owner only)
- [ ] `logout()` — clear all

### UI Components
- [ ] Login form (email/password)
- [ ] Register form (2-step)
- [ ] OTP input
- [ ] Logout button in TopBar

### Security
- [ ] Passwords hashed on backend ✅ (Laravel does this)
- [ ] Tokens stored in localStorage ✅
- [ ] Protected routes check auth ✅
- [ ] Tokens sent in Authorization header ✅
- [ ] Logout clears localStorage ✅

### Testing
- [ ] Manual: Register as owner → redirects to /dashboard
- [ ] Manual: Login as owner → redirects to /dashboard
- [ ] Manual: Login as staff → redirects to /staff/schedule
- [ ] Manual: OTP flow → redirects to /my-bookings
- [ ] Manual: Logout → redirects to /ar/auth/login
- [ ] Manual: Page refresh → auth state persists
- [ ] Manual: Protected route without token → redirects to login

---

## After Authentication is Complete

You'll have:
✅ **Owner registration + login**
✅ **Staff login**
✅ **Customer OTP flow**
✅ **Proper routing per user type**
✅ **Auth state persistence**
✅ **Protected routes**
✅ **Logout functionality**

Ready for: **Phase 5 Dashboard** (already specified but now with working auth)