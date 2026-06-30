'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Service, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of services.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated service data.
 */
export function useServicesList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Service>>(
        '/owner/services',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single service's details.
 *
 * @param id - The UUID of the service to fetch.
 * @returns A TanStack query result containing the service data.
 */
export function useServiceDetail(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get<{ data: Service }>(
        `/owner/services/${id}`,
      )
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering service creation.
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      duration_minutes: number
      price: number
      branch_id: string
    }) => {
      const response = await api.post<{ data: Service }>(
        '/owner/services',
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Custom hook for updating an existing service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering the service update.
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const response = await api.patch<{ data: Service }>(
        `/owner/services/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Custom hook for deleting a service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
