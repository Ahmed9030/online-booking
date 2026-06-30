'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Branch, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of branches.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated branch data.
 */
export function useBranchesList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Branch>>(
        '/owner/branches',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single branch's details.
 *
 * @param id - The UUID of the branch to fetch.
 * @returns A TanStack query result containing the branch data.
 */
export function useBranchDetail(id: string) {
  return useQuery({
    queryKey: ['branch', id],
    queryFn: async () => {
      const response = await api.get<{ data: Branch }>(`/owner/branches/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering branch creation.
 */
export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      address: string
      city: string
      whatsapp_number: string
      slug: string
    }) => {
      const response = await api.post<{ data: Branch }>('/owner/branches', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

/**
 * Custom hook for updating an existing branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the branch update.
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const response = await api.patch<{ data: Branch }>(
        `/owner/branches/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

/**
 * Custom hook for updating a branch's working hours.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the working hours update.
 */
export function useUpdateBranchWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      working_hours,
    }: {
      id: string
      working_hours: Array<{
        weekday: number
        open_time?: string | null
        close_time?: string | null
      }>
    }) => {
      await api.post(`/owner/branches/${id}/working-hours`, { working_hours })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branch', variables.id] })
    },
  })
}

/**
 * Custom hook for deleting a branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/branches/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}
