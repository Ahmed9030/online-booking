import { create } from 'zustand'
import { Branch, Service, Staff, AvailabilitySlot } from '@/types'

interface BookingStore {
  step: number // 1-5 for booking flow steps
  branch: Branch | null
  service: Service | null
  staff: Staff | null
  selectedDate: string | null
  selectedSlot: AvailabilitySlot | null
  availableSlots: AvailabilitySlot[]
  customerName: string
  customerPhone: string
  isLoading: boolean

  goToStep: (step: number) => void
  selectBranch: (branch: Branch) => void
  selectService: (service: Service) => void
  selectStaff: (staff: Staff | null) => void
  selectDate: (date: string) => void
  setAvailableSlots: (slots: AvailabilitySlot[]) => void
  selectSlot: (slot: AvailabilitySlot) => void
  setCustomerInfo: (name: string, phone: string) => void
  setIsLoading: (loading: boolean) => void

  reset: () => void
}

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
