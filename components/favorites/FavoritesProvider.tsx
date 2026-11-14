"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { addFavorite, favoriteErrorMessage, listFavoriteIds, removeFavorite } from "@/lib/favorites-api";

// Quién está mirando, a efectos del corazón:
// - "loading": aún no se sabe (no se pinta nada, para no parpadear).
// - "visitor": sin sesión; el corazón lleva al login y vuelve.
// - "unverified": cuenta `user` sin teléfono verificado; lleva a /complete-profile.
// - "user": puede guardar favoritos.
// - "none": restaurante o admin; el corazón no se muestra.
export type FavoritesMode = "loading" | "visitor" | "unverified" | "user" | "none";

type Toast = { id: number; text: string; tone: "ok" | "error"; showLink: boolean };

type FavoritesContextValue = {
  mode: FavoritesMode;
  // false hasta que llegan los ids (mientras tanto `isFavorite` usa el valor de respaldo).
  isReady: boolean;
  isFavorite: (establishmentId: number, fallback?: boolean) => boolean;
  isPending: (establishmentId: number) => boolean;
  // Cambia el favorito con actualización optimista; si el backend falla, deshace y avisa.
  toggle: (establishmentId: number, current: boolean) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const TOAST_MS = 3500;

// Una sola consulta de GET /favorites/ids por sesión para marcar los corazones de todas las tarjetas
// (directorio, inicio, mapa, detalle y /favorites). Va dentro de AuthProvider en el layout raíz.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [ids, setIds] = useState<Set<number> | null>(null);
  // Cambios hechos en esta sesión: mandan sobre `ids` (aunque lleguen antes que ellos) y sobre el respaldo.
  const [overrides, setOverrides] = useState<Map<number, boolean>>(() => new Map());
  const [pending, setPending] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const toastId = useRef(0);

  const mode: FavoritesMode =
    isLoading || user === undefined
      ? "loading"
      : !user
        ? "visitor"
        : user.role !== "user"
          ? "none"
          : user.phone_verified
            ? "user"
            : "unverified";

  const userId = mode === "user" ? user?.id : undefined;

  useEffect(() => {
    if (userId === undefined) {
      // Al cerrar sesión o cambiar de cuenta se olvidan los ids anteriores.
      void Promise.resolve().then(() => {
        setIds(null);
        setOverrides(new Map());
      });
      return;
    }
    const controller = new AbortController();
    listFavoriteIds({ signal: controller.signal })
      .then((list) => {
        if (!controller.signal.aborted) setIds(new Set(list));
      })
      .catch(() => {
        // Sin los ids se usa el valor de respaldo de cada tarjeta (p. ej. `is_favorite` del detalle).
      });
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((text: string, tone: Toast["tone"], showLink = false) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, tone, showLink });
  }, []);

  const setOne = (establishmentId: number, value: boolean) =>
    setOverrides((current) => new Map(current).set(establishmentId, value));

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const toggle = useCallback(
    async (establishmentId: number, current: boolean) => {
      if (pendingRef.current.has(establishmentId)) return;
      const next = !current;
      setPending((set) => new Set(set).add(establishmentId));
      setOne(establishmentId, next);
      try {
        if (next) await addFavorite(establishmentId);
        else await removeFavorite(establishmentId);
        showToast(next ? "Guardado en tus favoritos." : "Quitado de tus favoritos.", "ok", next);
      } catch (error) {
        setOne(establishmentId, current);
        showToast(favoriteErrorMessage(error), "error");
      } finally {
        setPending((set) => {
          const copy = new Set(set);
          copy.delete(establishmentId);
          return copy;
        });
      }
    },
    [showToast],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      mode,
      isReady: ids !== null,
      isFavorite: (establishmentId, fallback = false) =>
        overrides.get(establishmentId) ?? (ids ? ids.has(establishmentId) : fallback),
      isPending: (establishmentId) => pending.has(establishmentId),
      toggle,
    }),
    [mode, ids, overrides, pending, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
        {toast && (
          <p
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(23,36,61,0.25)] ${
              toast.tone === "error" ? "bg-[#a30f35] text-white" : "bg-[#17243d] text-white"
            }`}
          >
            {toast.text}
            {toast.showLink && (
              <Link href="/favorites" onClick={() => setToast(null)} className="font-bold text-[#5df0dc] hover:underline">
                Ver favoritos
              </Link>
            )}
          </p>
        )}
      </div>
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites debe usarse dentro de FavoritesProvider.");
  return context;
}
