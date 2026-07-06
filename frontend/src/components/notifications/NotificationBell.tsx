'use client'

import { useState } from 'react'
import {
  useNotifications,
  useMarkNotificationAsRead,
} from '@/features/notifications/hooks/useNotifications'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Notification bell icon with dropdown for displaying and managing
 * in-app notifications. Shows unread count badge and allows marking
 * notifications as read.
 */
export function NotificationBell() {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 neu-btn hover:neu-card-hover transition-all"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 neu-card rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-text-muted">
            <h3 className="font-bold text-primary">{t('notifications.notifications')}</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              {t('notifications.no_notifications')}
            </div>
          ) : (
            <div className="divide-y divide-text-muted/20">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-surface transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead.mutate(notification.id)
                    }
                  }}
                >
                  <Link href={notification.action_url || '#'}>
                    <div className="flex gap-3">
                      <span className="text-xl">{notification.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                          {new Date(notification.created_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
