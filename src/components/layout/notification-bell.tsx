"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/lib/api/hooks";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notificationsData } = useNotifications(1, 20);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.items ?? [];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function handleNotificationClick(notification: (typeof notifications)[0]) {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.resourceUrl) {
      router.push(notification.resourceUrl);
      setOpen(false);
    }
  }

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon-sm"
        className="relative text-muted-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="size-4" />
        <span className="sr-only">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {badgeLabel}
          </span>
        )}
      </Button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  <CheckCheck className="mr-1 size-3.5" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Notification list */}
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex shrink-0">
                      {!notification.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : (
                        <span className="h-2 w-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                        <span>{notification.workspaceName}</span>
                        <span>&middot;</span>
                        <span>
                          {formatDistanceToNow(
                            new Date(notification.createdAtUtc),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Read indicator */}
                    {notification.isRead && (
                      <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground/40" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
