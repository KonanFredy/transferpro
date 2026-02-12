'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { notificationsAPI, type Notification } from './api'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refreshNotifications = useCallback(async () => {
    // Only fetch if user is authenticated (has token)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const [notifs, count] = await Promise.all([
        notificationsAPI.getAll(),
        notificationsAPI.getUnreadCount()
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      // Silently fail - user may not be authenticated or backend not available
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check auth before fetching
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) return
    
    refreshNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(refreshNotifications, 30000)
    return () => clearInterval(interval)
  }, [refreshNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  const removeNotification = useCallback(async (id: string) => {
    try {
      await notificationsAPI.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      // Update unread count if the removed notification was unread
      const removedNotif = notifications.find(n => n.id === id)
      if (removedNotif && !removedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error removing notification:', error)
    }
  }, [notifications])

  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.deleteAll()
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
