"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications-api";

const POLL_INTERVAL_MS = 60_000;
// Al volver a la pestaña llegan "focus" y "visibilitychange" casi juntos: una sola consulta.
const MIN_REFRESH_GAP_MS = 5_000;
const LATEST_LIMIT = 5;

type NotificationsContextValue = {
  unreadCount: number;
  // Últimas notificaciones para la campana; null mientras no se han pedido.
  latest: AppNotification[] | null;
  isLoadingLatest: boolean;
  // Vuelve a consultar el contador (y las últimas, si ya se habían cargado).
  refresh: () => Promise<void>;
  // Recarga las últimas al abrir la campana.
  loadLatest: () => Promise<void>;
  markRead: (notification: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (notification: AppNotification) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

type State = {
  // Dueño de los datos: si cambia la sesión, lo guardado deja de valer sin tener que limpiarlo en un efecto.
  userId: number | null;
  count: number;
  latest: AppNotification[] | null;
};

const EMPTY: State = { userId: null, count: 0, latest: null };

// Contador y últimas notificaciones para toda la app (campana del Navbar y de AreaTopBar).
// Polling de /notifications/unread-count cada 60 s, solo con sesión y con la pestaña visible, más una
// consulta al recuperar el foco.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>(EMPTY);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);

  const userIdRef = useRef(userId);
  const lastCountAt = useRef(0);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchCount = useCallback(async () => {
    const owner = userIdRef.current;
    if (owner === null) return;
    lastCountAt.current = Date.now();
    try {
      const count = await getUnreadCount();
      if (userIdRef.current !== owner) return;
      setState((current) =>
        current.userId === owner ? { ...current, count } : { userId: owner, count, latest: null },
      );
    } catch {
      // Sesión vencida o API caída: se conserva el último valor y se reintenta en el siguiente ciclo.
    }
  }, []);

  const loadLatest = useCallback(async () => {
    const owner = userIdRef.current;
    if (owner === null) return;
    setIsLoadingLatest(true);
    try {
      const page = await listNotifications({ limit: LATEST_LIMIT });
      if (userIdRef.current !== owner) return;
      setState((current) => ({
        userId: owner,
        count: current.userId === owner ? current.count : 0,
        latest: page?.items ?? [],
      }));
    } catch {
      if (userIdRef.current === owner) {
        setState((current) => (current.userId === owner ? current : { userId: owner, count: 0, latest: [] }));
      }
    } finally {
      if (userIdRef.current === owner) setIsLoadingLatest(false);
    }
  }, []);

  const latestLoaded = state.userId === userId && state.latest !== null;
  const refresh = useCallback(async () => {
    await Promise.all([fetchCount(), latestLoaded ? loadLatest() : Promise.resolve()]);
  }, [fetchCount, loadLatest, latestLoaded]);

  useEffect(() => {
    if (userId === null) return;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCountAt.current < MIN_REFRESH_GAP_MS) return;
      void fetchCount();
    };

    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(fetchCount);
    const timer = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [userId, fetchCount]);

  const markRead = useCallback(
    async (notification: AppNotification) => {
      if (notification.is_read) return;
      const readAt = new Date().toISOString();
      setState((current) => ({
        ...current,
        count: Math.max(0, current.count - 1),
        latest:
          current.latest?.map((item) =>
            item.id === notification.id ? { ...item, is_read: true, read_at: readAt } : item,
          ) ?? null,
      }));
      try {
        await markNotificationRead(notification.id);
      } catch {
        void fetchCount();
      }
    },
    [fetchCount],
  );

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setState((current) => ({
      ...current,
      count: 0,
      latest: current.latest?.map((item) => (item.is_read ? item : { ...item, is_read: true, read_at: readAt })) ?? null,
    }));
    try {
      await markAllNotificationsRead();
    } catch {
      void fetchCount();
    }
  }, [fetchCount]);

  const remove = useCallback(
    async (notification: AppNotification) => {
      await deleteNotification(notification.id);
      setState((current) => ({
        ...current,
        count: notification.is_read ? current.count : Math.max(0, current.count - 1),
        latest: current.latest?.filter((item) => item.id !== notification.id) ?? null,
      }));
    },
    [],
  );

  const ownState = state.userId === userId ? state : EMPTY;
  const value = useMemo<NotificationsContextValue>(
    () => ({
      unreadCount: userId === null ? 0 : ownState.count,
      latest: userId === null ? null : ownState.latest,
      isLoadingLatest,
      refresh,
      loadLatest,
      markRead,
      markAllRead,
      remove,
    }),
    [userId, ownState.count, ownState.latest, isLoadingLatest, refresh, loadLatest, markRead, markAllRead, remove],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications debe usarse dentro de <NotificationsProvider>.");
  return context;
}
