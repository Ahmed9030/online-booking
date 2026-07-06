'use client'

import { useEffect } from 'react'
import { api } from '@/services/api'

/**
 * Hook to register the browser for push notifications.
 * Registers the service worker, requests permission, and sends
 * the push subscription to the backend.
 */
export function usePushNotifications() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const subscribeToPushNotifications = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        await api.post('/notifications/subscribe', {
          subscription: subscription.toJSON(),
        })
      } catch (error) {
        console.error('Push notification setup failed:', error)
      }
    }

    subscribeToPushNotifications()
  }, [])
}
