"use client";

import { AlertCircle, Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import RequireRole from "@/components/common/RequireRole";
import NotificationItem from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/components/notifications/NotificationsProvider";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listNotifications, safeNotificationLink, type AppNotification } from "@/lib/notifications-api";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "No leídas" },
];

// Bandeja completa de notificaciones (cualquier rol con sesión).
export default function NotificationsPage() {
  return (
    <RequireRole roles={["user", "restaurant", "admin"]}>
      <NotificationsInbox />
    </RequireRole>
  );
}

function NotificationsInbox() {
  const { unreadCount, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  // Cambia al marcar todas como leídas para que la lista se vuelva a montar con datos frescos.
  const [revision, setRevision] = useState(0);

  const handleMarkAll = async () => {
    await markAllRead();
    setRevision((value) => value + 1);
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Notificaciones</h1>
            <p className="text-sm text-[#43506a]">
              {unreadCount > 0
                ? `Tienes ${unreadCount} ${unreadCount === 1 ? "notificación sin leer" : "notificaciones sin leer"}.`
                : "Estás al día."}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#d7dcf2] bg-white px-4 text-sm font-semibold text-[#514ddd] transition hover:bg-[#f3f5ff]"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              Marcar todas como leídas
            </button>
          )}
        </header>

        <div role="tablist" aria-label="Filtrar notificaciones" className="inline-flex rounded-xl bg-[#eef0ff] p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === value ? "bg-white text-[#514ddd] shadow-sm" : "text-[#43506a] hover:text-[#514ddd]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <NotificationList key={`${filter}-${revision}`} unreadOnly={filter === "unread"} />
      </div>
    </main>
  );
}

function NotificationList({ unreadOnly }: { unreadOnly: boolean }) {
  const router = useRouter();
  const { markRead, remove } = useNotifications();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const loadedRef = useRef(0);

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listNotifications({ unreadOnly, skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) => {
          const merged = skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))];
          loadedRef.current = merged.length;
          return merged;
        });
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tus notificaciones.");
        setItems((current) => current ?? []);
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(() => load(0));
  }, [load]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    await load(loadedRef.current);
    setIsLoadingMore(false);
  };

  const open = (notification: AppNotification) => {
    void markRead(notification);
    const link = safeNotificationLink(notification.link);
    if (link) {
      router.push(link);
    } else {
      setItems((current) => current?.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)) ?? null);
    }
  };

  const markOne = (notification: AppNotification) => {
    void markRead(notification);
    setItems((current) => current?.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)) ?? null);
  };

  const removeOne = async (notification: AppNotification) => {
    setActionError("");
    try {
      await remove(notification);
      setItems((current) => current?.filter((item) => item.id !== notification.id) ?? null);
      loadedRef.current = Math.max(0, loadedRef.current - 1);
      setTotal((value) => Math.max(0, value - 1));
    } catch (removeError) {
      setActionError(removeError instanceof Error ? removeError.message : "No fue posible eliminar la notificación.");
    }
  };

  if (items === null) {
    return (
      <ul aria-busy="true" className="space-y-3">
        {[0, 1, 2, 3].map((key) => (
          <li key={key} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </ul>
    );
  }

  if (error && items.length === 0) {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={unreadOnly ? "No tienes notificaciones sin leer" : "Aún no tienes notificaciones"}
        description="Aquí verás las respuestas a tus reseñas, los recordatorios de tus planes y los avisos de tu cuenta."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </p>
      )}
      <ul className="space-y-3">
        {items.map((notification) => (
          <li
            key={notification.id}
            className={`rounded-2xl p-4 shadow-[0_8px_24px_rgba(23,36,61,0.05)] ring-1 transition ${
              notification.is_read ? "bg-white ring-[#eef0f6]" : "bg-[#f5f6ff] ring-[#d7dcf2]"
            }`}
          >
            <NotificationItem
              notification={notification}
              actions={
                <div className="flex shrink-0 items-center gap-1">
                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => markOne(notification)}
                      aria-label={`Marcar como leída: ${notification.title}`}
                      title="Marcar como leída"
                      className="flex size-9 items-center justify-center rounded-full text-[#514ddd] transition hover:bg-white"
                    >
                      <Check aria-hidden="true" className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeOne(notification)}
                    aria-label={`Eliminar: ${notification.title}`}
                    title="Eliminar"
                    className="flex size-9 items-center justify-center rounded-full text-[#6d6e7a] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              }
            />
            {safeNotificationLink(notification.link) && (
              <button
                type="button"
                onClick={() => open(notification)}
                className="ml-12 mt-2 text-sm font-semibold text-[#514ddd] hover:underline"
              >
                Ver detalle
              </button>
            )}
          </li>
        ))}
      </ul>
      <LoadMoreButton loaded={items.length} total={total} isLoading={isLoadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
