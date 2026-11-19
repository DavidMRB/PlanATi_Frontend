"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "@/components/common/useDismiss";
import NotificationItem from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import { safeNotificationLink, type AppNotification } from "@/lib/notifications-api";

// Campana del Navbar y de AreaTopBar: contador de no leídas, últimas 5 y acceso a /notifications.
// Los datos vienen de NotificationsProvider (polling cada 60 s).
export default function NotificationsBell() {
  const router = useRouter();
  const { unreadCount, latest, loadLatest, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadLatest();
  };

  const openNotification = (notification: AppNotification) => {
    void markRead(notification);
    setOpen(false);
    const link = safeNotificationLink(notification.link);
    if (link) router.push(link);
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="relative flex size-10 items-center justify-center rounded-full text-[#43506a] transition hover:bg-[#f3f5fb] hover:text-[#514ddd]"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6154a] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-x-3 top-[3.75rem] z-50 flex max-h-[min(32rem,calc(100dvh-5rem))] flex-col rounded-2xl bg-white shadow-[0_16px_40px_rgba(23,36,61,0.18)] ring-1 ring-[#e4e6f0] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#eef0f6] px-4 py-3">
            <p className="text-sm font-bold text-[#17243d]">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#514ddd] transition hover:bg-[#f3f5ff]"
              >
                <CheckCheck aria-hidden="true" className="size-3.5" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {latest === null ? (
              <ul aria-busy="true" className="space-y-2 p-2">
                {[0, 1, 2].map((key) => (
                  <li key={key} className="flex gap-3">
                    <span className="size-9 shrink-0 animate-pulse rounded-full bg-[#eef0ff]" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-[#eef0ff]" />
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-[#eef0ff]" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : latest.length === 0 ? (
              <div className="m-2 flex flex-col items-center gap-2 rounded-xl bg-[#f3f5ff] px-4 py-6 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#514ddd]">
                  <Bell aria-hidden="true" className="size-5" />
                </span>
                <p className="text-sm font-semibold text-[#26344d]">Estás al día</p>
                <p className="text-xs text-[#6d6e7a]">Aún no tienes notificaciones.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {latest.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`w-full rounded-xl px-3 py-2.5 transition hover:bg-[#f3f5fb] focus-visible:outline-2 focus-visible:outline-[#514ddd] ${
                        notification.is_read ? "" : "bg-[#f5f6ff]"
                      }`}
                    >
                      <NotificationItem notification={notification} compact />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[#eef0f6] p-2">
            <Link
              href="/notifications"
              onClick={close}
              className="flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-[#514ddd] transition hover:bg-[#f3f5ff]"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
