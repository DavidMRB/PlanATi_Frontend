import { API_URL } from "./api";

// Token CSRF de la sesión actual (sección 3.5 del plan de la fase 2).
// Vive SOLO en memoria: nunca en localStorage, sessionStorage ni en una cookie legible.
// El backend lo entrega en `csrf_token` al iniciar sesión (login, registros, canje de Google) y con
// GET /auth/csrf cuando la página se recarga con una sesión abierta. Los helpers de escritura de
// lib/auth-api.ts lo envían en la cabecera X-CSRF-Token.
export const CSRF_HEADER = "X-CSRF-Token";
export const CSRF_FAILED_CODE = "CSRF_FAILED";

let csrfToken: string | null = null;
let pendingRefresh: Promise<string | null> | null = null;
// Cambia con cada clearCsrfToken(): una petición iniciada antes del logout no guarda su token.
let generation = 0;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null | undefined): void {
  csrfToken = typeof token === "string" && token ? token : null;
}

export function clearCsrfToken(): void {
  generation += 1;
  csrfToken = null;
  pendingRefresh = null;
}

async function fetchCsrfToken(startedAt: number): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { csrf_token?: unknown };
    if (startedAt !== generation) return null;
    setCsrfToken(typeof data.csrf_token === "string" ? data.csrf_token : null);
    return csrfToken;
  } catch {
    return null;
  }
}

// Pide a la API el token de la sesión abierta. Devuelve null si no hay sesión (401) o la API falla.
// Las llamadas simultáneas comparten la misma petición.
export function refreshCsrfToken(): Promise<string | null> {
  if (!pendingRefresh) {
    const startedAt = generation;
    pendingRefresh = fetchCsrfToken(startedAt).finally(() => {
      if (startedAt === generation) pendingRefresh = null;
    });
  }
  return pendingRefresh;
}

// Guarda el token que trae la respuesta de una ruta que crea la sesión.
export function rememberSessionCsrf<T>(response: T): T {
  if (response && typeof response === "object" && "csrf_token" in response) {
    // Sesión nueva: una consulta a /auth/csrf de la sesión anterior ya no debe guardar su token.
    clearCsrfToken();
    setCsrfToken((response as { csrf_token?: unknown }).csrf_token as string | undefined);
  }
  return response;
}
