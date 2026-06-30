export interface User {
  id: string
  name: string
  email?: string
  phone?: string
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

export interface Staff {
  id: string
  name: string
  photo_url?: string
  is_active: boolean
  services?: Service[]
}

export interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
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
