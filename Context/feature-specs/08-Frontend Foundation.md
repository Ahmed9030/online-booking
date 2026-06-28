# Phase 4: Frontend Foundation Specification
# Booking SaaS — Barbershop Appointment Platform (Next.js 16)

> Complete specification for the Next.js 16 frontend architecture.
> This is the foundation for all user-facing features.
> All code is TypeScript-first with strict mode enabled.

---

## Architecture Overview

```
Frontend (Next.js 16)
├── Route Groups (by access level)
│   ├── (public)      ← Landing, pricing, booking flow
│   ├── (auth)        ← Login, register, OTP
│   ├── (customer)    ← My bookings (OTP session)
│   ├── (dashboard)   ← Owner/staff dashboard
│   └── (admin)       ← Platform admin (future)
├── Components
│   ├── ui/           ← shadcn/ui base components
│   ├── booking/      ← Booking-specific components
│   ├── calendar/     ← Calendar components
│   ├── forms/        ← Form components
│   ├── dashboard/    ← Dashboard components
│   └── layout/       ← Layout components
├── Features (by domain)
│   ├── auth/
│   │   ├── hooks/    ← useAuth, useLogin, etc.
│   │   ├── api/      ← Auth API calls
│   │   └── types/    ← Auth types
│   ├── bookings/
│   ├── staff/
│   └── customers/
├── Services
│   ├── api.ts        ← Axios instance
│   ├── queries.ts    ← TanStack Query hooks
│   └── storage.ts    ← LocalStorage utilities
├── Store (Zustand)
│   ├── auth.ts       ← Auth state
│   ├── ui.ts         ← UI state (modals, etc.)
│   └── booking.ts    ← Booking flow state
├── Lib
│   ├── validations/  ← Zod schemas
│   ├── utils/        ← Helper functions
│   └── constants/    ← App constants
├── I18n
│   ├── messages/     ← Arabic & English translations
│   ├── routing.ts    ← Locale routing
│   └── request.ts    ← Server-side i18n
├── Types
│   └── index.ts      ← All TypeScript interfaces
└── Middleware & Proxy
    └── proxy.ts      ← Route protection + locale handling
```

---

## Part 1: Core Setup Files

### File 1: `src/types/index.ts`

All shared TypeScript interfaces (single source of truth):

```typescript
// User types
export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: 'owner' | 'staff' | 'admin' | 'customer'
  business_id?: string
}

export interface LoginCredentials {
  email_or_username: string
  password: string
}

export interface AuthResponse {
  data: {
    user: User
    token: string
    business?: Business
  }
  message: string
}

// Business types
export interface Business {
  id: string
  name: string
  slug: string
  logo_url?: string
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended'
  subscription_expires_at: string
}

export interface Branch {
  id: string
  name: string
  address: string
  city: string
  whatsapp_number: string
  slug: string
  is_active: boolean
  working_hours?: WorkingHour[]
}

export interface WorkingHour {
  weekday: number // 0-6 (Sunday-Saturday)
  open_time: string // "09:00"
  close_time: string // "18:00"
}

// Staff types
export interface Staff {
  id: string
  name: string
  photo_url?: string
  is_active: boolean
  services?: Service[]
}

// Service types
export interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

// Booking types
export interface Booking {
  id: string
  status: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  source: 'online' | 'manual'
  starts_at: string // ISO 8601
  ends_at: string
  customer?: Customer
  service?: Service
  staff?: Staff
  branch?: Branch
  notes?: string
  created_at: string
}

export interface CreateBookingRequest {
  branch_id: string
  service_id: string
  staff_id?: string | null // null for "any available"
  customer_name: string
  customer_phone: string
  starts_at: string
  ends_at: string
}

export interface AvailabilitySlot {
  id: string
  starts_at: string // ISO 8601
  ends_at: string
  staff_id: string
  staff_name: string
}

// Customer types
export interface Customer {
  id: string
  name: string
  phone: string
  visit_count: number
  last_visit_at?: string
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Form types
export interface BookingFormData {
  branch_id: string
  service_id: string
  staff_id?: string | null
  date: string // YYYY-MM-DD
  time: string // HH:MM
  customer_name: string
  customer_phone: string
}
```

### File 2: `src/services/api.ts`

Axios instance with interceptors:

```typescript
import axios, { AxiosError } from 'axios'

/**
 * Axios instance configured with base URL and default headers.
 * Automatically attaches the auth token from localStorage and handles
 * 401 responses by clearing auth state and redirecting to login.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/**
 * Request interceptor that attaches the Bearer token from localStorage
 * to every outgoing request if a token exists.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response interceptor that handles 401 errors by clearing the stored
 * auth token and redirecting the user to the login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/ar/login'
    }

    return Promise.reject(error)
  },
)

export default api
```

### File 3: `src/lib/validations/index.ts`

Zod schemas for all forms:

```typescript
import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email_or_username: z.string().min(1, 'مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'الاسم قصير جداً').max(100),
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: z.string().min(8, 'كلمة المرور ضعيفة جداً'),
    password_confirmation: z.string(),
    business_name: z.string().min(3, 'اسم المشروع قصير'),
    branch_name: z.string().min(3, 'اسم الفرع قصير'),
    branch_address: z.string().min(5, 'العنوان قصير'),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'كلمات المرور غير متطابقة',
    path: ['password_confirmation'],
  })

export const otpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'رقم هاتف مصري غير صحيح'),
})

export const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'الكود يجب أن يكون 6 أرقام'),
})

// Booking schemas
export const bookingSchema = z.object({
  branch_id: z.string().uuid('معرف الفرع غير صحيح'),
  service_id: z.string().uuid('معرف الخدمة غير صحيح'),
  staff_id: z.string().uuid('معرف الموظف غير صحيح').optional().nullable(),
  customer_name: z.string().min(2, 'الاسم قصير جداً').max(100),
  customer_phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'رقم هاتف غير صحيح'),
  date: z.string().date('التاريخ غير صحيح'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'الوقت غير صحيح'),
})

// Dashboard schemas
export const branchSchema = z.object({
  name: z.string().min(3, 'اسم الفرع قصير').max(100),
  address: z.string().min(5, 'العنوان قصير'),
  city: z.string().max(50),
  whatsapp_number: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9\-]+$/, 'يجب أن يحتوي على أحرف وأرقام وشرطات فقط'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type OtpFormData = z.infer<typeof otpSchema>
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type BranchFormData = z.infer<typeof branchSchema>
```

### File 4: `src/store/auth.ts`

Zustand auth store:

```typescript
import { create } from 'zustand'
import { User, Business } from '@/types'

/**
 * Authentication store interface managing user session state.
 * Tracks the authenticated user, their business, auth token, and loading state.
 */
interface AuthStore {
  /** Currently authenticated user */
  user: User | null
  /** Business associated with the authenticated user */
  business: Business | null
  /** Sanctum API token */
  token: string | null
  /** Loading state for auth operations */
  isLoading: boolean

  /** Set the authenticated user */
  setUser: (user: User | null) => void
  /** Set the current business */
  setBusiness: (business: Business | null) => void
  /** Set the auth token and persist to localStorage */
  setToken: (token: string | null) => void
  /** Set the loading state */
  setIsLoading: (loading: boolean) => void

  /** Check if a user is authenticated (has a token) */
  isAuthenticated: () => boolean
  /** Check if the current user has the owner role */
  isOwner: () => boolean
  /** Check if the current user has the staff role */
  isStaff: () => boolean
  /** Check if the current user has the admin role */
  isAdmin: () => boolean

  /** Clear all auth state and remove token from localStorage */
  logout: () => void
}

/**
 * Zustand store for managing authentication state and user session.
 * Persists the auth token to localStorage and provides role-checking helpers.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  business: null,
  token: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  setBusiness: (business) => set({ business }),
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  },
  setIsLoading: (loading) => set({ isLoading: loading }),

  isAuthenticated: () => !!get().token,
  isOwner: () => get().user?.role === 'owner',
  isStaff: () => get().user?.role === 'staff',
  isAdmin: () => get().user?.role === 'admin',

  logout: () => {
    set({ user: null, business: null, token: null })
    localStorage.removeItem('auth_token')
  },
}))
```

### File 5: `src/store/booking.ts`

Zustand booking flow state:

```typescript
import { create } from 'zustand'
import { Branch, Service, Staff, AvailabilitySlot } from '@/types'

/**
 * Booking flow store interface managing the multi-step booking process.
 * Tracks selections across steps 1-5: branch, service, staff, date/time, and customer info.
 */
interface BookingStore {
  /** Current step in the booking flow (1-5) */
  step: number
  /** Selected branch */
  branch: Branch | null
  /** Selected service */
  service: Service | null
  /** Selected staff member (null for any available) */
  staff: Staff | null
  /** Selected booking date (YYYY-MM-DD) */
  selectedDate: string | null
  /** Selected time slot */
  selectedSlot: AvailabilitySlot | null
  /** Available time slots for the current selection */
  availableSlots: AvailabilitySlot[]
  /** Customer's name */
  customerName: string
  /** Customer's phone number */
  customerPhone: string
  /** Loading state for availability checks */
  isLoading: boolean

  /** Navigate to a specific step in the booking flow */
  goToStep: (step: number) => void
  /** Select a branch and advance to step 2 */
  selectBranch: (branch: Branch) => void
  /** Select a service and advance to step 3 */
  selectService: (service: Service) => void
  /** Select a staff member (or null for any) */
  selectStaff: (staff: Staff | null) => void
  /** Select a date for the booking */
  selectDate: (date: string) => void
  /** Set the list of available time slots */
  setAvailableSlots: (slots: AvailabilitySlot[]) => void
  /** Select a specific time slot and advance to step 4 */
  selectSlot: (slot: AvailabilitySlot) => void
  /** Set customer name and phone for step 4 */
  setCustomerInfo: (name: string, phone: string) => void
  /** Set the loading state */
  setIsLoading: (loading: boolean) => void
  /** Reset all booking state back to step 1 */
  reset: () => void
}

/**
 * Zustand store for managing the multi-step booking flow state.
 * Tracks user selections across all steps and provides reset capability.
 */
export const useBookingStore = create<BookingStore>((set) => ({
  step: 1,
  branch: null,
  service: null,
  staff: null,
  selectedDate: null,
  selectedSlot: null,
  availableSlots: [],
  customerName: '',
  customerPhone: '',
  isLoading: false,

  goToStep: (step) => set({ step }),
  selectBranch: (branch) => set({ branch, step: 2 }),
  selectService: (service) => set({ service, step: 3 }),
  selectStaff: (staff) => set({ staff }),
  selectDate: (date) => set({ selectedDate: date }),
  setAvailableSlots: (slots) => set({ availableSlots: slots }),
  selectSlot: (slot) => set({ selectedSlot: slot, step: 4 }),
  setCustomerInfo: (name, phone) => set({ customerName: name, customerPhone: phone }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({
    step: 1,
    branch: null,
    service: null,
    staff: null,
    selectedDate: null,
    selectedSlot: null,
    availableSlots: [],
    customerName: '',
    customerPhone: '',
  }),
}))
```

### File 6: `src/store/ui.ts`

UI state (modals, notifications, etc.):

```typescript
import { create } from 'zustand'

/**
 * UI state store interface for managing modals, notifications, and sidebar.
 */
interface UiStore {
  /** Whether the login modal is open */
  isLoginModalOpen: boolean
  /** Whether the register modal is open */
  isRegisterModalOpen: boolean
  /** Whether the OTP modal is open */
  isOtpModalOpen: boolean
  /** Current toast notification message */
  toastMessage: string | null
  /** Toast notification type for styling */
  toastType: 'success' | 'error' | 'info'
  /** Whether the sidebar is expanded */
  isSidebarOpen: boolean

  /** Open the login modal */
  openLoginModal: () => void
  /** Close the login modal */
  closeLoginModal: () => void
  /** Open the register modal */
  openRegisterModal: () => void
  /** Close the register modal */
  closeRegisterModal: () => void
  /** Open the OTP modal */
  openOtpModal: () => void
  /** Close the OTP modal */
  closeOtpModal: () => void
  /** Show a toast notification */
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  /** Clear the current toast notification */
  clearToast: () => void
  /** Toggle the sidebar open/closed */
  toggleSidebar: () => void
}

/**
 * Zustand store for managing global UI state including modals, toast notifications, and sidebar.
 */
export const useUiStore = create<UiStore>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isOtpModalOpen: false,
  toastMessage: null,
  toastType: 'info',
  isSidebarOpen: true,

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),

  openOtpModal: () => set({ isOtpModalOpen: true }),
  closeOtpModal: () => set({ isOtpModalOpen: false }),

  showToast: (message, type) => set({ toastMessage: message, toastType: type }),
  clearToast: () => set({ toastMessage: null }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
```

---

## Part 2: Hooks & API Functions

### Hook 1: `src/features/auth/hooks/useLogin.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { LoginFormData, AuthResponse } from '@/types'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for owner/staff login with password-based authentication.
 * On success, stores the user and token in the auth store and redirects
 * based on the user's role. On error, displays a toast notification.
 *
 * @returns A TanStack mutation object for triggering the login request.
 */
export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      setUser(data.data.user)
      setToken(data.data.token)
      showToast('تم تسجيل الدخول بنجاح', 'success')

      // Redirect based on role
      const role = data.data.user.role
      if (role === 'owner' || role === 'staff') {
        router.push('/ar/dashboard')
      } else {
        router.push('/ar/my-bookings')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'فشل تسجيل الدخول'
      showToast(message, 'error')
    },
  })
}
```

### Hook 2: `src/features/bookings/hooks/useCreateBooking.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CreateBookingRequest, Booking, ApiResponse } from '@/types'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for creating a public booking via the API.
 * Displays a success toast on completion or an error toast on failure.
 *
 * @returns A TanStack mutation object for triggering the booking creation.
 */
export function useCreateBooking() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const response = await api.post<ApiResponse<Booking>>(
        '/public/bookings',
        data,
      )
      return response.data.data
    },
    onSuccess: (booking) => {
      showToast(`تم الحجز بنجاح! الحجز: ${booking.id}`, 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'فشل إنشاء الحجز'
      showToast(message, 'error')
    },
  })
}
```

### Hook 3: `src/features/bookings/hooks/useAvailability.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AvailabilitySlot, ApiResponse } from '@/types'

interface CheckAvailabilityRequest {
  branch_id: string
  service_id: string
  staff_id?: string | null
  date: string
}

/**
 * Custom hook for checking available booking time slots.
 * Automatically enabled when params are provided.
 *
 * @param params - The branch, service, optional staff, and date to check availability for.
 * @returns A TanStack query result containing an array of available slots.
 */
export function useAvailability(params?: CheckAvailabilityRequest) {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: async () => {
      if (!params) return null

      const response = await api.post<{
        data: { slots: AvailabilitySlot[] }
      }>('/public/availability/check', params)

      return response.data.data.slots
    },
    enabled: !!params,
  })
}
```

### Hook 4: `src/features/auth/hooks/useOtp.ts`

```typescript
'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useUiStore } from '@/store/ui'

/**
 * Custom hook for sending an OTP code to a customer's phone via WhatsApp.
 * Displays a success or error toast based on the result.
 *
 * @returns A TanStack mutation object for triggering the OTP send.
 */
export function useSendOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async (phone: string) => {
      await api.post('/auth/otp/send', { phone })
    },
    onSuccess: () => {
      showToast('تم إرسال الكود على واتساب', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'فشل إرسال الكود', 'error')
    },
  })
}

/**
 * Custom hook for verifying an OTP code and obtaining an auth token.
 * Displays an error toast on failure.
 *
 * @returns A TanStack mutation object for triggering the OTP verification.
 */
export function useVerifyOtp() {
  const showToast = useUiStore((s) => s.showToast)

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const response = await api.post('/auth/otp/verify', { phone, code })
      return response.data
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'كود غير صحيح', 'error')
    },
  })
}
```

---

## Part 3: Core Components

### Component 1: `src/components/ui/Button.tsx`

Neumorphism button (shadcn base + custom styling):

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button variant styles using class-variance-authority.
 * Supports default, primary, ghost, and danger variants with multiple sizes.
 */
const buttonVariants = cva(
  `neu-btn inline-flex items-center justify-center whitespace-nowrap rounded-md 
   text-sm font-medium ring-offset-background transition-all focus-visible:outline-none 
   focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: 'neu-btn bg-surface text-primary',
        primary: 'neu-btn-primary bg-primary text-white',
        ghost: 'hover:bg-surface hover:text-primary',
        danger: 'neu-btn-primary bg-danger text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/** Props for the Button component combining HTML button attributes with variant options. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders the button as a child element using Radix Slot */
  asChild?: boolean
}

/**
 * Neumorphism-styled button component with multiple variants and sizes.
 * Supports primary, default, ghost, and danger color schemes.
 * Can be rendered as a child component using the asChild prop.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Component 2: `src/components/booking/ServiceSelector.tsx`

Step 1 of booking flow:

```typescript
'use client'

import { Service } from '@/types'
import { Button } from '@/components/ui/button'
import { useBookingStore } from '@/store/booking'
import { useTranslations } from 'next-intl'

/** Props for the ServiceSelector component. */
interface ServiceSelectorProps {
  /** Array of available services to display */
  services: Service[]
}

/**
 * Step 1 of the booking flow: displays available services and allows
 * the user to select one, which advances the booking store to step 2.
 */
export function ServiceSelector({ services }: ServiceSelectorProps) {
  const selectService = useBookingStore((s) => s.selectService)
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">
        {t('booking.select_service')}
      </h2>

      <div className="grid gap-3">
        {services.map((service) => (
          <Button
            key={service.id}
            variant="default"
            onClick={() => selectService(service)}
            className="neu-card flex items-center justify-between p-4"
          >
            <div>
              <div className="font-medium">{service.name}</div>
              <div className="text-sm text-text-secondary">
                {service.duration_minutes} دقيقة
              </div>
            </div>
            <div className="font-bold text-primary">{service.price} ج.م</div>
          </Button>
        ))}
      </div>
    </div>
  )
}
```

### Component 3: `src/components/booking/TimeSlotPicker.tsx`

Step 3 of booking flow:

```typescript
'use client'

import { AvailabilitySlot } from '@/types'
import { Button } from '@/components/ui/button'
import { useBookingStore } from '@/store/booking'
import { useTranslations } from 'next-intl'

/** Props for the TimeSlotPicker component. */
interface TimeSlotPickerProps {
  /** Array of available time slots to display */
  slots: AvailabilitySlot[]
}

/**
 * Step 3 of the booking flow: displays available time slots in a grid
 * and allows the user to select one, advancing the booking store to step 4.
 */
export function TimeSlotPicker({ slots }: TimeSlotPickerProps) {
  const selectSlot = useBookingStore((s) => s.selectSlot)
  const selectedSlot = useBookingStore((s) => s.selectedSlot)
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">
        {t('booking.select_time')}
      </h2>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const startTime = new Date(slot.starts_at).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const isSelected = selectedSlot?.id === slot.id

          return (
            <Button
              key={slot.id}
              variant={isSelected ? 'primary' : 'default'}
              onClick={() => selectSlot(slot)}
              className={`neu-slot ${isSelected ? 'neu-slot-selected' : ''}`}
            >
              {startTime}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
```

### Component 4: `src/components/forms/BookingForm.tsx`

Complete booking form (all steps):

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, BookingFormData } from '@/lib/validations'
import { useBookingStore } from '@/store/booking'
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking'
import { useAvailability } from '@/features/bookings/hooks/useAvailability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'

/** Props for the BookingForm component. */
interface BookingFormProps {
  /** Array of services available for booking */
  services: any[]
}

/**
 * Complete booking form that orchestrates the multi-step booking flow.
 * Renders the appropriate step component (ServiceSelector, TimeSlotPicker, or form)
 * based on the current step in the booking store, and handles form submission.
 */
export function BookingForm({ services }: BookingFormProps) {
  const t = useTranslations()
  const step = useBookingStore((s) => s.step)
  const goToStep = useBookingStore((s) => s.goToStep)
  const createBooking = useCreateBooking()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const onSubmit = async (data: BookingFormData) => {
    // Convert date + time to starts_at and ends_at
    const [startTime, endTime] = ['14:00', '14:30'] // Example
    const starts_at = `${data.date} ${startTime}`
    const ends_at = `${data.date} ${endTime}`

    await createBooking.mutateAsync({
      branch_id: data.branch_id,
      service_id: data.service_id,
      staff_id: data.staff_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      starts_at,
      ends_at,
    })
  }

  if (step === 1) {
    return <ServiceSelector services={services} />
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        placeholder={t('booking.enter_details')}
        {...form.register('customer_name')}
      />
      <Button type="submit">{t('common.confirm')}</Button>
    </form>
  )
}
```

---

## Part 4: Page Structure

### Pages Directory Structure

```
src/app/[locale]/
├── layout.tsx              ← Root layout with RTL/LTR
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx           ← Landing page
│   ├── pricing/
│   │   └── page.tsx       ← Pricing page
│   └── book/
│       ├── layout.tsx
│       └── [businessSlug]/
│           ├── page.tsx   ← Business overview
│           └── [branchSlug]/
│               ├── page.tsx                ← Booking flow start
│               ├── service-select/page.tsx ← Step 1
│               ├── staff-select/page.tsx   ← Step 2
│               ├── time-select/page.tsx    ← Step 3
│               ├── confirm/page.tsx        ← Step 4
│               └── success/page.tsx        ← Success
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx      ← Owner/staff login
│   └── register/page.tsx   ← Owner signup
├── (customer)/
│   ├── layout.tsx
│   └── my-bookings/
│       ├── page.tsx        ← List bookings
│       └── [id]/page.tsx   ← Booking detail + cancel
├── (dashboard)/
│   ├── layout.tsx          ← Dashboard wrapper
│   ├── dashboard/page.tsx  ← Overview
│   ├── calendar/page.tsx   ← Calendar view
│   ├── bookings/
│   │   ├── page.tsx        ← Bookings list
│   │   └── [id]/page.tsx   ← Booking detail
│   ├── customers/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── staff/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── branches/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── services/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── settings/page.tsx
└── (admin)/
    ├── layout.tsx
    ├── overview/page.tsx
    └── businesses/
        ├── page.tsx
        └── [id]/page.tsx
```

### Page 1: `src/app/[locale]/(public)/book/[businessSlug]/[branchSlug]/page.tsx`

Booking flow start (fetches branch + services):

```typescript
import { api } from '@/services/api'
import { Branch, Service } from '@/types'
import { BookingForm } from '@/components/forms/BookingForm'

/** Props for the booking page route. */
interface BookingPageProps {
  params: {
    locale: string
    businessSlug: string
    branchSlug: string
  }
}

/**
 * Server-side rendered booking page that fetches branch details and
 * services for the given business and branch slugs.
 * Renders the BookingForm component with the fetched services.
 */
export default async function BookingPage({ params }: BookingPageProps) {
  // Fetch branch and services server-side (SSR)
  const branchResponse = await api.get<{ data: Branch }>(
    `/public/business/${params.businessSlug}/branches/${params.branchSlug}`,
  )
  const branch = branchResponse.data.data

  const servicesResponse = await api.get<{ data: Service[] }>(
    `/public/branches/${branch.id}/services`,
  )
  const services = servicesResponse.data.data

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-primary">{branch.name}</h1>
        <BookingForm services={services} />
      </div>
    </div>
  )
}
```

### Page 2: `src/app/[locale]/(auth)/login/page.tsx`

Owner/staff login:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Owner/staff login page with form validation using Zod.
 * Renders email/username and password fields and handles
 * authentication via the useLogin hook.
 */
export default function LoginPage() {
  const t = useTranslations()
  const login = useLogin()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="neu-card w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-primary text-center">
          {t('auth.login')}
        </h1>

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
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? t('common.loading') : t('auth.login')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {t('auth.no_account')}{' '}
          <Link href="/ar/register" className="font-medium text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Page 3: `src/app/[locale]/(dashboard)/dashboard/page.tsx`

Owner dashboard overview:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

/** Dashboard overview statistics returned from the API. */
interface DashboardStats {
  /** Number of confirmed bookings for today */
  today_bookings: number
  /** Total non-cancelled bookings this month */
  month_bookings: number
  /** Percentage of no-show bookings this month */
  no_show_rate: number
  /** Current subscription details */
  subscription: {
    /** Subscription status (trial, active, expired, suspended) */
    status: string
    /** Days remaining until subscription expires */
    days_remaining: number
  }
}

/**
 * Owner dashboard overview page displaying key metrics:
 * today's bookings, monthly bookings, no-show rate, and subscription status.
 * Fetches data from the dashboard API endpoint on mount.
 */
export default function DashboardPage() {
  const t = useTranslations()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardStats }>('/owner/dashboard')
      return response.data.data
    },
  })

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t('nav.dashboard')}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="neu-card p-6">
          <div className="text-sm text-text-secondary">{t('common.today')}</div>
          <div className="text-2xl font-bold text-primary">{stats?.today_bookings}</div>
          <div className="text-xs text-text-muted">حجوزات</div>
        </div>

        <div className="neu-card p-6">
          <div className="text-sm text-text-secondary">هذا الشهر</div>
          <div className="text-2xl font-bold text-primary">{stats?.month_bookings}</div>
          <div className="text-xs text-text-muted">إجمالي الحجوزات</div>
        </div>

        <div className="neu-card p-6">
          <div className="text-sm text-text-secondary">معدل عدم الحضور</div>
          <div className="text-2xl font-bold text-danger">{stats?.no_show_rate}%</div>
        </div>

        <div className="neu-card p-6">
          <div className="text-sm text-text-secondary">الاشتراك</div>
          <div className="text-2xl font-bold text-accent">
            {stats?.subscription.days_remaining}
          </div>
          <div className="text-xs text-text-muted">أيام متبقية</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/ar/dashboard/calendar">
          <Button variant="primary" className="w-full">
            {t('nav.calendar')}
          </Button>
        </Link>
        <Link href="/ar/dashboard/bookings">
          <Button variant="primary" className="w-full">
            {t('nav.bookings')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

---

## Part 5: Middleware & Routing

### File: `src/proxy.ts`

Next.js 16 proxy (replaces middleware.ts):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

/**
 * Next.js 16 proxy middleware (replaces middleware.ts) that handles locale routing.
 * Checks if the incoming request path already contains a supported locale prefix.
 * If not, redirects to the default locale (Arabic).
 *
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse either passing through or redirecting to the localized path.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  request.nextUrl.pathname = `/${routing.defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Match all pathnames except for those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### File: `src/i18n/routing.ts`

I18n routing configuration:

```typescript
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

// Create navigation helpers
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

---

## Part 6: Layout Files

### File: `src/app/[locale]/layout.tsx`

Root layout with RTL/LTR:

```typescript
import { ReactNode } from 'react'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/services/query-client'
import '../globals.css'

interface RootLayoutProps {
  children: ReactNode
  params: { locale: string }
}

/**
 * Root layout component that sets up internationalization, RTL/LTR direction,
 * and TanStack Query provider for the entire application.
 *
 * @param children - The child components to render within the layout.
 * @param params - Route parameters containing the locale.
 */
export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  const messages = await getMessages()
  const isArabic = locale === 'ar'

  return (
    <html lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
      <body className="bg-bg text-text-primary">
        <NextIntlClientProvider messages={messages}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### File: `src/app/[locale]/(dashboard)/layout.tsx`

Dashboard layout with sidebar:

```typescript
'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

/** Props for the dashboard layout wrapper. */
interface DashboardLayoutProps {
  /** Child page components to render within the dashboard shell */
  children: ReactNode
}

/**
 * Dashboard layout component providing authenticated owner access.
 * Checks for a valid auth token and owner role, redirecting to login
 * if unauthorized. Renders the Sidebar, TopBar, and main content area.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const isOwner = useAuthStore((s) => s.isOwner())

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!token) {
      router.push('/ar/login')
    }
  }, [token, router])

  if (!token || !isOwner) {
    return null
  }

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Part 7: Implementation Checklist

### Phase 4 Core Files
- [x] `src/types/index.ts` — All TypeScript types
- [x] `src/services/api.ts` — Axios instance + interceptors
- [x] `src/lib/validations/index.ts` — All Zod schemas
- [x] `src/store/auth.ts` — Auth Zustand store
- [x] `src/store/booking.ts` — Booking flow state
- [x] `src/store/ui.ts` — UI state
- [x] `src/proxy.ts` — Next.js 16 proxy for locale (replaces middleware.ts)
- [x] `src/i18n/routing.ts` — Routing config

### Hooks & API
- [x] `src/features/auth/hooks/useLogin.ts`
- [x] `src/features/auth/hooks/useOtp.ts`
- [x] `src/features/bookings/hooks/useCreateBooking.ts`
- [x] `src/features/bookings/hooks/useAvailability.ts`

### Components (Neumorphism)
- [x] `src/components/ui/Button.tsx`
- [x] `src/components/ui/Input.tsx`
- [x] `src/components/ui/Card.tsx`
- [x] `src/components/booking/ServiceSelector.tsx`
- [x] `src/components/booking/TimeSlotPicker.tsx`
- [x] `src/components/forms/BookingForm.tsx`
- [x] `src/components/layout/Sidebar.tsx`
- [x] `src/components/layout/TopBar.tsx`

### Pages
- [x] `src/app/[locale]/(public)/page.tsx` — Landing
- [x] `src/app/[locale]/(public)/book/[businessSlug]/[branchSlug]/page.tsx` — Booking flow
- [x] `src/app/[locale]/(auth)/login/page.tsx` — Owner login
- [x] `src/app/[locale]/(auth)/register/page.tsx` — Owner signup
- [x] `src/app/[locale]/(dashboard)/dashboard/page.tsx` — Owner overview
- [x] `src/app/[locale]/(customer)/my-bookings/page.tsx` — Customer bookings

### Layouts
- [x] `src/app/[locale]/layout.tsx` — Root layout
- [x] `src/app/[locale]/(public)/layout.tsx` — Public pages
- [x] `src/app/[locale]/(auth)/layout.tsx` — Auth pages
- [x] `src/app/[locale]/(dashboard)/layout.tsx` — Dashboard layout
- [x] `src/app/[locale]/(customer)/layout.tsx` — Customer layout

### i18n & Config
- [x] `src/i18n/routing.ts` — Routing setup
- [x] `src/i18n/request.ts` — Server-side i18n
- [x] `src/i18n/messages/ar.json` — Arabic translations
- [x] `src/i18n/messages/en.json` — English translations
- [x] Update `tsconfig.json` with paths
- [x] Update `next.config.ts` with i18n plugin

### Styling
- [x] Verify Tailwind CSS variables in `src/app/globals.css`
- [x] Test Neumorphism shadows on all components
- [x] Verify RTL rendering in both locales
- [x] Test color contrast (WCAG AA)
- [x] Fix hardcoded neumorphism shadow colors → CSS variables for light/dark
- [x] Add hover/active interaction states to neumorphism elements
- [x] Fix `--surface` vs `--bg` contrast for proper neumorphism separation
- [x] Add loading skeleton states across all pages
- [x] Add empty state components
- [x] Consistent spacing and visual hierarchy

---

## Testing Checklist

After completing Phase 4, manually test:

- [ ] Arabic RTL layout renders correctly
- [ ] Login flow (submit email + password)
- [ ] OTP flow (send + verify)
- [ ] Public booking flow (select service → time → confirm)
- [ ] Dashboard loads with stats
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Neumorphism shadows appear correct
- [ ] Toast notifications show
- [ ] Form validation errors display
- [ ] Unauthorized users are redirected to login

---

## After Phase 4

Phase 5 will add:
- Calendar view (FullCalendar integration)
- Booking management (owner CRUD)
- Customer management
- Staff management
- Settings pages
- Advanced filtering/search

Phase 4 establishes the **foundation** — all subsequent features build on these core patterns.