'use client'

import { useEffect } from 'react'
import { api } from '@/services/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData.split('').map((char) => char.charCodeAt(0)))
}

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

        const applicationServerKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
        )

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
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
