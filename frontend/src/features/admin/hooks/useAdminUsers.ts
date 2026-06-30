'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { AdminUser, PaginatedResponse } from '@/types'

/** Parameters for filtering the admin users list. */
interface UseAdminUsersParams {
  /** Page number for pagination. */
  page?: number
  /** Filter by user role (owner | staff | admin | customer). */
  role?: string
  /** Filter by active status. */
  is_active?: boolean
  /** Search query matched against name, email, phone, and username. */
  search?: string
}

/**
 * Fetches a paginated list of all platform users for the admin view.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack UseQueryResult containing paginated AdminUser data.
 */
export function useAdminUsers(params?: UseAdminUsersParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AdminUser>>(
        '/admin/users',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Toggles a user's active status (activate / deactivate).
 *
 * Sends a PATCH to the server which flips the `is_active` flag.
 * Invalidates the users query cache on success.
 *
 * @returns A TanStack UseMutationResult that accepts a user UUID.
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ data: AdminUser }>(
        `/admin/users/${id}/status`,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
