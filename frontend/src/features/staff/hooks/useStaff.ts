'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Staff, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of staff members.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated staff data.
 */
export function useStaffList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Staff>>(
        '/owner/staff',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single staff member's details.
 *
 * @param id - The UUID of the staff member to fetch.
 * @returns A TanStack query result containing the staff data.
 */
export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const response = await api.get<{ data: Staff }>(`/owner/staff/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering staff creation.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      branch_id: string
      phone?: string
    }) => {
      const response = await api.post<{ data: Staff }>('/owner/staff', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for updating an existing staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the staff update.
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const response = await api.patch<{ data: Staff }>(
        `/owner/staff/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for updating a staff member's working hours.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the working hours update.
 */
export function useUpdateStaffWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      working_hours,
    }: {
      id: string
      working_hours: Array<{
        weekday: number
        start_time?: string | null
        end_time?: string | null
      }>
    }) => {
      await api.post(`/owner/staff/${id}/working-hours`, { working_hours })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staff', variables.id] })
    },
  })
}

/**
 * Custom hook for assigning services to a staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the service assignment.
 */
export function useAssignStaffServices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      service_ids,
    }: {
      id: string
      service_ids: string[]
    }) => {
      await api.post(`/owner/staff/${id}/services`, { service_ids })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for creating login credentials for a staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for creating staff login credentials.
 */
export function useCreateStaffLoginCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      username,
      password,
    }: {
      id: string
      username: string
      password: string
    }) => {
      const response = await api.post(`/owner/staff/${id}/login-credentials`, {
        username,
        password,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for deleting a staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/staff/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
