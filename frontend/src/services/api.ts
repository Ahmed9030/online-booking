import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth'

/**
 * Axios instance configured with base URL and default headers.
 * Automatically attaches the auth token from the in-memory store and handles
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
 * Request interceptor that attaches the Bearer token from the auth store
 * to every outgoing request if a token exists.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response interceptor that handles 401 errors by clearing the
 * auth token and redirecting to login — but only when an authenticated
 * session existed (token was present). Unauthenticated 401s from
 * login/OTP endpoints are left for the caller to handle.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().setToken(null)
      const locale = window.location.pathname.split('/')[1] || 'ar'
      window.location.href = `/${locale}/login`
    }
    return Promise.reject(error)
  },
)

export default api
