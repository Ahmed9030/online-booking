'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Booking, PaginatedResponse } from '@/types'
import { useAuthStore } from '@/store/auth'

/** Parameters for filtering the bookings list. */
interface UseBookingsParams {
  /** Page number for pagination */
  page?: number
  /** Filter by booking status */
  status?: string
  /** Filter by branch ID (owner only) */
  branch_id?: string
  /** Date range start (staff calendar) */
  date_from?: string
  /** Date range end (staff calendar) */
  date_to?: string
}

function getBookingsEndpoint(): string {
  const isStaff = useAuthStore.getState().isStaff()
  return isStaff ? '/staff/bookings' : '/owner/bookings'
}

/**
 * Custom hook for fetching a paginated, filterable list of bookings.
 * Uses the owner endpoint for owner users and staff endpoint for staff users.
 */
export function useDashboardBookings(params?: UseBookingsParams) {
  const endpoint = getBookingsEndpoint()

  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Booking>>(
        endpoint,
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single booking's details.
 *
 * @param id - The UUID of the booking to fetch.
 */
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.get<{ data: Booking }>(`/owner/bookings/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for updating a booking's status (complete, no-show, cancel).
 * Uses the owner endpoint for owner users and staff endpoint for staff users.
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  const isStaff = useAuthStore.getState().isStaff()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'completed' | 'no_show' | 'cancelled'
    }) => {
      const endpoint = isStaff
        ? `/staff/bookings/${id}/${status === 'cancelled' ? 'cancelled' : status === 'completed' ? 'completed' : 'no-show'}`
        : `/owner/bookings/${id}/status`
      const response = await api.patch<{ data: Booking }>(endpoint, isStaff ? {} : { status })
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] })
    },
  })
}

/**
 * Custom hook for creating a manual booking from the dashboard.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<{ data: Booking }>(
        '/owner/bookings',
        data,
      )
      return response.data.data
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      if (booking?.id) {
        queryClient.invalidateQueries({ queryKey: ['booking', booking.id] })
      }
    },
  })
}

/**
 * Custom hook for deleting/cancelling a booking.
 * For staff: cancels the booking via the cancelled endpoint.
 * For owner: deletes the booking.
 */
export function useDeleteBooking() {
  const queryClient = useQueryClient()
  const isStaff = useAuthStore.getState().isStaff()

  return useMutation({
    mutationFn: async (id: string) => {
      if (isStaff) {
        await api.patch(`/staff/bookings/${id}/cancelled`)
      } else {
        await api.delete(`/owner/bookings/${id}`)
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
    },
  })
}
