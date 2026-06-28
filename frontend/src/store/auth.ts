import { create } from 'zustand'
import { User, Business } from '@/types'

interface AuthStore {
  user: User | null
  business: Business | null
  token: string | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setBusiness: (business: Business | null) => void
  setToken: (token: string | null) => void
  setIsLoading: (loading: boolean) => void

  isAuthenticated: () => boolean
  isOwner: () => boolean
  isStaff: () => boolean
  isAdmin: () => boolean

  logout: () => void
}

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
