export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  username?: string
  role: 'owner' | 'staff' | 'admin' | 'customer'
  business_id?: string
}

export interface VerifyOtpResponse {
  token: string
  phone: string
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

export interface Business {
  id: string
  name: string
  slug: string
  logo_url?: string
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended'
  subscription_expires_at?: string
  subscription_days_remaining?: number
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
  open_time: string | null // "09:00" or null for day off
  close_time: string | null // "18:00" or null for day off
}

export interface StaffWorkingHour {
  weekday: number
  start_time: string | null
  end_time: string | null
}

export interface Staff {
  id: string
  name: string
  photo_url?: string
  is_active: boolean
  branch_id?: string
  services?: Service[]
  working_hours?: StaffWorkingHour[]
}

export interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
  branch_id?: string
}

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

export interface Customer {
  id: string
  name: string
  phone: string
  visit_count: number
  last_visit_at?: string
}

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

export interface BookingFormData {
  branch_id: string
  service_id: string
  staff_id?: string | null
  date: string // YYYY-MM-DD
  time: string // HH:MM
  customer_name: string
  customer_phone: string
}

// =================== Admin Domain Types ===================

export interface AdminOverview {
  businesses: {
    total: number
    active: number
    trial: number
  }
  customers: number
  bookings_total: number
  bookings_month: number
}

export interface AdminBusiness extends Business {
  description?: string
  owner?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  branches_count?: number
  staff_count?: number
  services_count?: number
  bookings_count?: number
  created_at: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string
  role: 'owner' | 'staff' | 'admin' | 'customer'
  business_id?: string
  is_active: boolean
  created_at: string
  business?: {
    id: string
    name: string
    slug: string
    subscription_status: string
  }
}

export interface Subscription {
  id: string
  name: string
  slug: string
  logo_url?: string
  subscription_status: string
  subscription_expires_at?: string
  owner?: {
    id: string
    name: string
    email: string
  }
  branches_count?: number
  staff_count?: number
  bookings_count?: number
  created_at: string
}

// =================== Notification Domain Types ===================

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  icon?: string
  action_url?: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface AppPushSubscription {
  id: string
  user_id: string
  subscription: Record<string, unknown>
  user_agent?: string
  is_active: boolean
}

export interface AdminAnalytics {
  revenue: {
    total: number
    this_month: number
    monthly: { month: string; revenue: number }[]
  }
  users: {
    total: number
    this_month: number
    monthly: { month: string; count: number }[]
  }
  bookings: {
    total: number
    by_status: Record<string, number>
    monthly: { month: string; count: number }[]
  }
  businesses: {
    total: number
    by_subscription: Record<string, number>
  }
}
