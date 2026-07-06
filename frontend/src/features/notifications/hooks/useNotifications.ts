'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

/**
 * Interface representing an in-app notification.
 */
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  icon?: string
  action_url?: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch notifications for the authenticated user.
 * Polls every 10 seconds for real-time updates.
 *
 * @returns The TanStack Query result containing notifications array.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data.data as Notification[]
    },
    refetchInterval: 10000,
  })
}

/**
 * Hook to mark a single notification as read.
 *
 * @returns The TanStack Mutation for marking a notification as read.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to delete a single notification.
 *
 * @returns The TanStack Mutation for deleting a notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
