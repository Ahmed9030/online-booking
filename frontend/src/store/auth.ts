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
  /** Set the auth token (in-memory only) */
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

  /** Clear all auth state (in-memory only) */
  logout: () => void
}

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function saveToStorage<T>(key: string, value: T | null): void {
  if (typeof window === 'undefined') return
  if (value === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

function setAuthCookie(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) {
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  } else {
    document.cookie = 'auth_token=; path=/; max-age=0'
  }
}

/**
 * Zustand store for managing authentication state and user session.
 * Persists token, user, and business to localStorage for hydration
 * across page refreshes, and syncs the token to a cookie for the
 * proxy middleware to read on server-side requests.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  user: loadFromStorage<User>('auth_user'),
  business: loadFromStorage<Business>('auth_business'),
  token: loadFromStorage<string>('auth_token'),
  isLoading: false,

  setUser: (user) => {
    set({ user })
    saveToStorage('auth_user', user)
  },
  setBusiness: (business) => {
    set({ business })
    saveToStorage('auth_business', business)
  },
  setToken: (token) => {
    set({ token })
    saveToStorage('auth_token', token)
    setAuthCookie(token)
  },
  setIsLoading: (loading) => set({ isLoading: loading }),

  isAuthenticated: () => !!get().token,
  isOwner: () => get().user?.role === 'owner',
  isStaff: () => get().user?.role === 'staff',
  isAdmin: () => get().user?.role === 'admin',

  logout: () => {
    set({ user: null, business: null, token: null })
    saveToStorage('auth_user', null)
    saveToStorage('auth_business', null)
    saveToStorage('auth_token', null)
    setAuthCookie(null)
  },
}))
