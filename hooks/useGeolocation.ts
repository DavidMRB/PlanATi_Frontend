"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo";

// Ubicación del navegador (sección 3.2 del plan de la fase 2).
// Solo funciona en contexto seguro (HTTPS o localhost): desde un celular en http://192.168.x.x no hay GPS.
// Si el permiso ya está concedido, la posición se obtiene sin preguntar; si no, se pide SOLO cuando el
// usuario toca un botón (`request()`).

export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable" | "timeout" | "error";

export type GeoPosition = LatLng & { accuracy: number; timestamp: number };

// "nearby": buscar lugares cercanos (rápido, admite una posición de hasta 5 min).
// "precise": ubicar un establecimiento (alta precisión, posición nueva).
export type GeoMode = "nearby" | "precise";

const OPTIONS: Record<GeoMode, PositionOptions> = {
  nearby: { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
  precise: { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
};

export const GEO_STATUS_MESSAGE: Partial<Record<GeoStatus, string>> = {
  denied:
    "No diste permiso para usar tu ubicación. Actívalo en la configuración del navegador (el ícono junto a la dirección de la página) y vuelve a intentarlo.",
  unavailable: "No pudimos obtener tu ubicación en este dispositivo.",
  timeout: "La ubicación tardó demasiado en responder. Inténtalo de nuevo.",
  error: "Ocurrió un error al obtener tu ubicación. Inténtalo de nuevo.",
};

const INSECURE_MESSAGE = "La ubicación solo funciona en una conexión segura (HTTPS).";

// Última posición para no volver a pedirla en cada navegación (solo en esta pestaña).
const CACHE_KEY = "planati:lastPosition";
const CACHE_MAX_AGE_MS = 15 * 60 * 1000;

function readCachedPosition(): GeoPosition | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GeoPosition>;
    if (
      typeof value.lat !== "number" ||
      typeof value.lng !== "number" ||
      typeof value.accuracy !== "number" ||
      typeof value.timestamp !== "number" ||
      Date.now() - value.timestamp > CACHE_MAX_AGE_MS
    ) {
      return null;
    }
    return value as GeoPosition;
  } catch {
    return null;
  }
}

function writeCachedPosition(position: GeoPosition): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(position));
  } catch {
    // Almacenamiento bloqueado (modo privado, etc.): no pasa nada.
  }
}

async function queryPermission(): Promise<PermissionState | null> {
  try {
    if (!navigator.permissions?.query) return null;
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return null; // Safari antiguo no admite "geolocation" en la API de permisos.
  }
}

type GeoState = { status: GeoStatus; position: GeoPosition | null; message: string | null };

type UseGeolocationOptions = {
  mode?: GeoMode;
  // Si el permiso ya está concedido (o hay una posición reciente en esta pestaña), obtenerla al montar.
  auto?: boolean;
};

export function useGeolocation({ mode = "nearby", auto = true }: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeoState>({ status: "idle", position: null, message: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = useCallback((): Promise<GeoPosition | null> => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unavailable", position: null, message: GEO_STATUS_MESSAGE.unavailable ?? null });
      return Promise.resolve(null);
    }
    if (!window.isSecureContext) {
      setState({ status: "unavailable", position: null, message: INSECURE_MESSAGE });
      return Promise.resolve(null);
    }

    setState((current) => ({ ...current, status: "prompting", message: null }));
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (result) => {
          const position: GeoPosition = {
            lat: result.coords.latitude,
            lng: result.coords.longitude,
            accuracy: result.coords.accuracy,
            timestamp: result.timestamp || Date.now(),
          };
          if (mode === "nearby") writeCachedPosition(position);
          if (mounted.current) setState({ status: "granted", position, message: null });
          resolve(position);
        },
        (error) => {
          const status: GeoStatus =
            error.code === error.PERMISSION_DENIED
              ? "denied"
              : error.code === error.TIMEOUT
                ? "timeout"
                : error.code === error.POSITION_UNAVAILABLE
                  ? "unavailable"
                  : "error";
          if (mounted.current) {
            setState((current) => ({ ...current, status, message: GEO_STATUS_MESSAGE[status] ?? null }));
          }
          resolve(null);
        },
        OPTIONS[mode],
      );
    });
  }, [mode]);

  useEffect(() => {
    if (!auto) return;
    let cancelled = false;

    void (async () => {
      const permission = await queryPermission();
      if (cancelled) return;
      if (permission === "denied") {
        setState((current) => ({ ...current, status: "denied", message: GEO_STATUS_MESSAGE.denied ?? null }));
        return;
      }
      const cached = mode === "nearby" ? readCachedPosition() : null;
      if (cached) {
        setState({ status: "granted", position: cached, message: null });
        return;
      }
      if (permission === "granted") void request();
    })();

    return () => {
      cancelled = true;
    };
  }, [auto, mode, request]);

  return { ...state, request, isLocating: state.status === "prompting" };
}
