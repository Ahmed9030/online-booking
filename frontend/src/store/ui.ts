import { create } from 'zustand'

interface UiStore {
  isLoginModalOpen: boolean
  isRegisterModalOpen: boolean
  isOtpModalOpen: boolean

  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'

  isSidebarOpen: boolean

  openLoginModal: () => void
  closeLoginModal: () => void

  openRegisterModal: () => void
  closeRegisterModal: () => void

  openOtpModal: () => void
  closeOtpModal: () => void

  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  clearToast: () => void

  toggleSidebar: () => void
}

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
