import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllReadApi,
  type Notification,
} from "@/lib/notifications-api";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, error: notificationsError } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotificationsApi,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch unread count
  const { data: unreadCountData, error: unreadCountError } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCountApi,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Log errors for debugging
  if (notificationsError) {
    console.error("Notifications fetch error:", notificationsError);
  }
  if (unreadCountError) {
    console.error("Unread count fetch error:", unreadCountError);
  }

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadCountData?.count || 0;

  // Debug logging
  useEffect(() => {
    console.log("🔔 Notifications loaded:", notifications.length);
    console.log("📊 Unread count:", unreadCount);
    if (notificationsError) {
      console.error("❌ Notifications error:", notificationsError);
    }
  }, [notifications, unreadCount, notificationsError]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_order":
        return "📦";
      case "order_confirmed":
        return "✅";
      case "order_status_changed":
        return "🔄";
      case "low_stock_alert":
        return "⚠️";
      default:
        return "📢";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge variant="default" className="bg-blue-500 flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.orderNumber && (
                          <span className="text-xs text-blue-600 font-mono">
                            {notification.orderNumber}
                          </span>
                        )}
                        {notification.productName && (
                          <span className="text-xs text-yellow-600 font-mono">
                            {notification.productName}
                            {notification.currentStock !== undefined && ` (${notification.currentStock} units)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
