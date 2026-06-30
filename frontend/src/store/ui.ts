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
