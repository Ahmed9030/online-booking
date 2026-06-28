import { create } from 'zustand'
import { Branch, Service, Staff, AvailabilitySlot } from '@/types'

/**
 * Booking flow store interface managing the multi-step booking process.
 * Tracks selections across steps 1-5: branch, service, staff, date/time, and customer info.
 */
interface BookingStore {
  /** Current step in the booking flow (1-5) */
  step: number
  /** Selected branch */
  branch: Branch | null
  /** Selected service */
  service: Service | null
  /** Selected staff member (null for any available) */
  staff: Staff | null
  /** Selected booking date (YYYY-MM-DD) */
  selectedDate: string | null
  /** Selected time slot */
  selectedSlot: AvailabilitySlot | null
  /** Available time slots for the current selection */
  availableSlots: AvailabilitySlot[]
  /** Customer's name */
  customerName: string
  /** Customer's phone number */
  customerPhone: string
  /** Loading state for availability checks */
  isLoading: boolean

  /** Navigate to a specific step in the booking flow */
  goToStep: (step: number) => void
  /** Select a branch and advance to step 2 */
  selectBranch: (branch: Branch) => void
  /** Select a service and advance to step 3 */
  selectService: (service: Service) => void
  /** Select a staff member (or null for any) */
  selectStaff: (staff: Staff | null) => void
  /** Select a date for the booking */
  selectDate: (date: string) => void
  /** Set the list of available time slots */
  setAvailableSlots: (slots: AvailabilitySlot[]) => void
  /** Select a specific time slot and advance to step 4 */
  selectSlot: (slot: AvailabilitySlot) => void
  /** Set customer name and phone for step 4 */
  setCustomerInfo: (name: string, phone: string) => void
  /** Set the loading state */
  setIsLoading: (loading: boolean) => void
  /** Reset all booking state back to step 1 */
  reset: () => void
}

/**
 * Zustand store for managing the multi-step booking flow state.
 * Tracks user selections across all steps and provides reset capability.
 */
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
  selectBranch: (branch) => set({ branch, step: 2, service: null, staff: null, selectedDate: null, selectedSlot: null, availableSlots: [] }),
  selectService: (service) => set({ service, step: 3, staff: null, selectedDate: null, selectedSlot: null, availableSlots: [] }),
  selectStaff: (staff) => set({ staff, selectedDate: null, selectedSlot: null, availableSlots: [] }),
  selectDate: (date) => set({ selectedDate: date, selectedSlot: null, availableSlots: [] }),
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
