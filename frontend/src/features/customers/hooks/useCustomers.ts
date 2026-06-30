'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Customer, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of customers.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated customer data.
 */
export function useCustomersList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Customer>>(
        '/owner/customers',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single customer's details.
 *
 * @param id - The UUID of the customer to fetch.
 * @returns A TanStack query result containing the customer data.
 */
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get<{ data: Customer }>(
        `/owner/customers/${id}`,
      )
      return response.data.data
    },
  })
}

/**
 * Custom hook for fetching a customer's booking history.
 *
 * @param id - The UUID of the customer.
 * @returns A TanStack query result containing the customer's bookings.
 */
export function useCustomerBookings(id: string) {
  return useQuery({
    queryKey: ['customer-bookings', id],
    queryFn: async () => {
      const response = await api.get(`/owner/customers/${id}/bookings`)
      return response.data.data
    },
  })
}
