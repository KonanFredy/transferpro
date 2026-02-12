'use client'

import { useState } from 'react'
import { Bell, Mail, Smartphone, CheckCircle, XCircle, Check, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useNotifications } from '@/lib/notification-context'
import type { Notification } from '@/lib/api'

export function NotificationsDropdown() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  // Rafraichir les notifications quand le popover s'ouvre
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      refreshNotifications()
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "A l'instant"
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`
  }

  const getStatusIcon = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-success" />
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />
      case 'pending':
        return <Clock className="h-3 w-3 text-warning" />
    }
  }

  const getTypeIcon = (type: Notification['type']) => {
    return type === 'email' ? (
      <Mail className="h-4 w-4 text-primary" />
    ) : (
      <Smartphone className="h-4 w-4 text-accent" />
    )
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs gap-1"
            >
              <Check className="h-3 w-3" />
              Tout marquer lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-10 w-10 mb-2 animate-spin opacity-50" />
              <p className="text-sm">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${!notification.read ? 'font-medium' : ''}`}>
                          {notification.subject}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notification.recipient}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(notification.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-center text-sm" 
            asChild
          >
            <Link href="/parametres?tab=notifications">
              Voir toutes les notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
