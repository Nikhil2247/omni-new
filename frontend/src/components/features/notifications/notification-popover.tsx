'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import type { NotificationItem } from '@/lib/api/types/notification.types'
import type { PopoverContentProps } from '@radix-ui/react-popover'

interface NotificationPopoverProps {
  className?: string
  contentSide?: PopoverContentProps['side']
  contentAlign?: PopoverContentProps['align']
  sheetSide?: 'top' | 'right' | 'bottom' | 'left'
}

export function NotificationPopover({
  className,
  contentSide = 'bottom',
  contentAlign = 'end',
  sheetSide = 'right',
}: NotificationPopoverProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss, dismissAll, connected } = useNotifications({
    page: 1,
    limit: 100,
    unreadOnly: false,
    includeDismissed: false,
  })

  const hasUnread = unreadCount > 0
  const badgeLabel = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount])

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead([item.id])
    }
    if (item.actionUrl) {
      router.push(item.actionUrl)
    }
  }

  const popoverNotifications = useMemo(() => notifications.slice(0, 20), [notifications])

  return (
    <>
    <button
      className={cn('relative rounded-lg p-2 text-foreground/90 hover:bg-accent transition-colors', className)}
      aria-label="Notifications"
      onClick={() => setIsOpen(true)}
    >
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {badgeLabel}
        </span>
      )}
    </button>

    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side={sheetSide} className="p-0">
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>All notifications</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                disabled={!hasUnread}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Mark read
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={dismissAll}
                disabled={!notifications.length}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete all
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {connected ? 'Live updates enabled' : 'Reconnecting...'}
          </p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : (notifications?.length ?? 0) === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="divide-y">
              {notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onClick={handleNotificationClick}
                  onDelete={dismiss}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
    </>
  )
}

function NotificationRow({
  item,
  onClick,
  onDelete,
}: {
  item: NotificationItem
  onClick: (item: NotificationItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <button
        onClick={() => onClick(item)}
        className="flex flex-1 flex-col gap-1 text-left"
      >
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium', !item.isRead && 'text-primary')}>
            {item.title}
          </p>
          {!item.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </span>
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onDelete(item.id)}
        aria-label="Delete notification"
      >
        <X className="mr-1 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  )
}
