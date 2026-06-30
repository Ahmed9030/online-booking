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
 * to every outgoing request if a token exists — unless `skipAuth` is set
 * in the request config (used for login/register endpoints where sending
 * an existing token would interfere with credential-based auth).
 */
api.interceptors.request.use((config) => {
  if (config.skipAuth) return config
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const authEndpoints = ['/auth/login', '/auth/logout', '/auth/register', '/otp/send', '/otp/verify']

/**
 * Response interceptor that handles 401 errors by clearing the
 * auth token and redirecting to login — but only when an authenticated
 * session existed (token was present). Login/OTP/register endpoints are
 * excluded so the calling code can handle auth errors gracefully.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? ''
    const isAuthEndpoint = authEndpoints.some((ep) => requestUrl.startsWith(ep))
    if (error.response?.status === 401 && useAuthStore.getState().token && !isAuthEndpoint) {
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        const locale = window.location.pathname.split('/')[1] || 'ar'
        window.location.href = `/${locale}/login`
      }
    }
    return Promise.reject(error)
  },
)

export default api
