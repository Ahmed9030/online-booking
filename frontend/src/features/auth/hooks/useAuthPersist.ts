'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

/**
 * Custom hook that restores authentication state from localStorage on
 * initial page load. If valid token and user data exist in storage, they
 * are hydrated into the auth store. Invalid or corrupted data is cleared.
 *
 * Use this hook once in the root layout to ensure auth state survives
 * page refreshes.
 */
export function useAuthPersist() {
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    const savedBusiness = localStorage.getItem('auth_business')

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        const business = savedBusiness ? JSON.parse(savedBusiness) : null

        useAuthStore.getState().setToken(savedToken)
        useAuthStore.getState().setUser(user)
        useAuthStore.getState().setBusiness(business)
      } catch {
        useAuthStore.getState().logout()
      }
    }
  }, [])
}
