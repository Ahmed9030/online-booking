// Service Worker for Push Notifications

self.addEventListener('push', function (event) {
  let data
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const options = {
    body: data.body || '',
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction !== false,
    data: data,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '', options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const actionUrl = event.notification.data?.action_url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(actionUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl)
      }
    })
  )
})
