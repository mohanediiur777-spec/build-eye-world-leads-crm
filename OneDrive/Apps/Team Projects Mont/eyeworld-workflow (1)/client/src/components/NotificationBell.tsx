import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Icon map for notification types
const TYPE_ICONS: Record<string, string> = {
  task_assigned:  "📋",
  task_viewed:    "👁️",
  task_replied:   "💬",
  task_delivered: "📦",
  task_approved:  "✅",
  status_change:  "🔄",
  new_request:    "📝",
  comment_reply:  "💬",
  comment_mention:"🔔",
};

export default function NotificationBell() {
  const [, navigate]   = useLocation();
  const [open, setOpen] = useState(false);
  const ref            = useRef<HTMLDivElement>(null);

  const { data: notifications, refetch } = trpc.notifications.getRecent.useQuery(undefined, {
    refetchInterval: 30_000, // poll every 30s
  });

  const markReadMutation    = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({ onSuccess: () => refetch() });

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = (notifId: number, requestId: number | null | undefined) => {
    markReadMutation.mutate({ notificationId: notifId });
    setOpen(false);
    if (requestId) {
      navigate(`/task/${requestId}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications in the last 4 days</p>
              </div>
            ) : (
              notifications.map(notif => {
                const icon = TYPE_ICONS[notif.type] ?? "🔔";
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.requestId)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 ${
                      !notif.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0 leading-none mt-0.5">{icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400 text-center">Showing last 4 days</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
