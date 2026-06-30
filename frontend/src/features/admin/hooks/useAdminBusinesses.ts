'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AdminBusiness, PaginatedResponse } from '@/types'

/** Parameters for filtering the admin businesses list. */
interface UseAdminBusinessesParams {
  /** Page number for pagination. */
  page?: number
  /** Filter by subscription status (trial | active | expired | suspended). */
  subscription_status?: string
  /** Search query matched against business name and slug. */
  search?: string
}

/**
 * Fetches a paginated list of all platform businesses for the admin view.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack UseQueryResult containing paginated AdminBusiness data.
 */
export function useAdminBusinesses(params?: UseAdminBusinessesParams) {
  return useQuery({
    queryKey: ['admin', 'businesses', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminBusiness>>(
        '/admin/businesses',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Fetches a single business's full details for the admin detail view.
 *
 * @param id - The UUID of the business.
 * @returns A TanStack UseQueryResult containing the AdminBusiness data.
 */
export function useAdminBusinessDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'businesses', id],
    queryFn: async () => {
      const response = await api.get<{ data: AdminBusiness }>(
        `/admin/businesses/${id}`,
      )
      return response.data.data
    },
    enabled: !!id,
  })
}

/**
 * Updates a business's subscription status and optional expiry date.
 *
 * Invalidates the businesses query cache on success.
 *
 * @returns A TanStack UseMutationResult for updating the subscription.
 */
export function useUpdateBusinessSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      subscription_status,
      subscription_expires_at,
    }: {
      /** The business UUID. */
      id: string
      /** New subscription status. */
      subscription_status: string
      /** Optional ISO date string for the new expiry date. */
      subscription_expires_at?: string | null
    }) => {
      const response = await api.patch<{ data: AdminBusiness }>(
        `/admin/businesses/${id}/subscription`,
        { subscription_status, subscription_expires_at },
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
  })
}

/**
 * Toggles a business's status between active and suspended.
 *
 * Invalidates the businesses query cache on success.
 *
 * @returns A TanStack UseMutationResult for toggling the business status.
 */
export function useUpdateBusinessStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      subscription_status,
    }: {
      /** The business UUID. */
      id: string
      /** New subscription status to apply. */
      subscription_status: string
    }) => {
      const response = await api.patch<{ data: AdminBusiness }>(
        `/admin/businesses/${id}/status`,
        { subscription_status },
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
  })
}
