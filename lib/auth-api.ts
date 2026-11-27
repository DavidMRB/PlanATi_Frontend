import { API_URL } from "./api";
import {
  CSRF_FAILED_CODE,
  CSRF_HEADER,
  clearCsrfToken,
  getCsrfToken,
  refreshCsrfToken,
  rememberSessionCsrf,
} from "./csrf";

export type AuthResponse = {
  registration_complete: boolean;
  requires_phone_verification: boolean;
  authenticated?: boolean;
  role?: string | null;
  establishment_status?: string | null;
  // Token CSRF de la sesión recién creada; lib/csrf.ts lo guarda en memoria.
  csrf_token?: string;
};

export type UserProfile = {
  id: number;
  full_name: string;
  nickname?: string | null;
  email: string;
  role: string;
  google_sub?: string | null;
  picture?: string | null;
  phone_number?: string | null;
  phone_verified: boolean;
  status: string;
  created_at?: string;
  // B8: documentos cuya versión vigente falta aceptar; vacío = al día. Con pendientes, las rutas
  // protegidas responden 403 CONSENT_REQUIRED y ConsentGate pide la aceptación.
  pending_consents?: Array<"PRIVACY_POLICY" | "TERMS">;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function authEndpoint(path: string): string {
  return `${API_URL}${path}`;
}

export const AUTH_ENDPOINTS = {
  login: authEndpoint("/auth/login"),
  register: authEndpoint("/auth/register"),
  google: authEndpoint("/auth/google"),
  googleExchange: authEndpoint("/auth/google/exchange"),
  logout: authEndpoint("/auth/logout"),
  profile: authEndpoint("/users/me"),
  saveProfile: authEndpoint("/users/me"),
  requestSms: authEndpoint("/auth/phone/send-code"),
  verifySms: authEndpoint("/auth/phone/verify"),
} as const;

async function parseApiError(response: Response, defaultMessage: string): Promise<ApiError> {
  let message = defaultMessage;
  let errorData: unknown;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as {
        detail?: string | Array<{ msg?: string } | string>;
        message?: string;
      };
      errorData = data;

      if (typeof data.detail === "string" && data.detail.trim()) {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        if (typeof first === "string" && first.trim()) {
          message = first;
        } else if (first && typeof first === "object" && typeof first.msg === "string") {
          // Pydantic antepone "Value error, " a los mensajes de los validadores propios.
          message = first.msg.replace(/^Value error, /, "");
        }
      } else if (typeof data.message === "string" && data.message.trim()) {
        message = data.message;
      }
    }
  } catch {
    // Non-JSON or empty response, keep defaultMessage
  }

  return new ApiError(message, response.status, errorData);
}

// Código de error de la API (`{"detail", "code"}`), p. ej. "CSRF_FAILED".
export function apiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const data = error.data;
  if (data && typeof data === "object" && "code" in data) {
    const code = (data as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Marca de "sin cuerpo" (GET y DELETE). `undefined` como payload se sigue enviando sin cuerpo pero
// con Content-Type JSON, como hacían los helpers antes.
const NO_BODY = Symbol("no-body");

function buildRequestInit(method: HttpMethod, payload: unknown, options: RequestInit): RequestInit {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (payload !== NO_BODY && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (method !== "GET") {
    // Solo a nuestra API: la subida a R2 (lib/uploads.ts) no pasa por aquí.
    const token = getCsrfToken();
    if (token) headers.set(CSRF_HEADER, token);
  }

  return {
    credentials: "include",
    ...options,
    method,
    headers,
    body: payload === NO_BODY || payload === undefined ? undefined : JSON.stringify(payload),
  };
}

async function isCsrfFailure(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  try {
    const data = (await response.clone().json()) as { code?: unknown };
    return data.code === CSRF_FAILED_CODE;
  } catch {
    return false;
  }
}

async function readJson<TResponse>(response: Response): Promise<TResponse | undefined> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) return undefined;
  return (await response.json()) as TResponse;
}

async function sendRequest<TResponse>(
  method: HttpMethod,
  endpoint: string,
  payload: unknown,
  options: RequestInit,
  readBody: (response: Response) => Promise<TResponse | undefined> = readJson<TResponse>,
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  let response = await fetch(endpoint, buildRequestInit(method, payload, options));

  // Token ausente (p. ej. la página se recargó y AuthProvider aún no lo pidió) o viejo:
  // se pide uno nuevo y se reintenta UNA sola vez. Si vuelve a fallar, el backend ya responde
  // "La solicitud fue rechazada por seguridad. Recarga la página e inténtalo de nuevo."
  if (method !== "GET" && (await isCsrfFailure(response))) {
    const token = await refreshCsrfToken();
    if (token) {
      response = await fetch(endpoint, buildRequestInit(method, payload, options));
    }
  }

  if (!response.ok) {
    const error = await parseApiError(response, `La solicitud falló con estado ${response.status}.`);
    if (error.status === 403 && apiErrorCode(error) === ACCOUNT_SUSPENDED_CODE) announceSuspension(error);
    if (error.status === 403 && apiErrorCode(error) === CONSENT_REQUIRED_CODE) announceConsentRequired();
    throw error;
  }

  return readBody(response);
}

// Cuenta suspendida (B5): el backend responde 403 `{"code": "ACCOUNT_SUSPENDED", "reason"}` en cualquier
// petición con la cookie, también en el login. AuthProvider escucha este evento y lleva a /account-suspended.
export const ACCOUNT_SUSPENDED_CODE = "ACCOUNT_SUSPENDED";
export const ACCOUNT_SUSPENDED_EVENT = "planati:account-suspended";

export function suspensionReason(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") return null;
  const reason = (error.data as { reason?: unknown }).reason;
  return typeof reason === "string" && reason.trim() ? reason : null;
}

// Política o términos sin aceptar (B8): ConsentGate escucha este evento y abre el modal de aceptación.
export const CONSENT_REQUIRED_CODE = "CONSENT_REQUIRED";
export const CONSENT_REQUIRED_EVENT = "planati:consent-required";

function announceConsentRequired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_REQUIRED_EVENT));
}

function announceSuspension(error: ApiError) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_SUSPENDED_EVENT, { detail: { reason: suspensionReason(error) } }));
}

export function getAuthRequest<TResponse = void>(
  endpoint: string,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  return sendRequest<TResponse>("GET", endpoint, NO_BODY, options);
}

export function getAuthFile(endpoint: string, options: RequestInit = {}): Promise<Blob | undefined> {
  return sendRequest<Blob>("GET", endpoint, NO_BODY, { ...options, cache: "no-store" }, response => response.blob());
}

export function postAuthRequest<TPayload, TResponse = void>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  return sendRequest<TResponse>("POST", endpoint, payload, options);
}

export function putAuthRequest<TPayload, TResponse = void>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  return sendRequest<TResponse>("PUT", endpoint, payload, options);
}

export function patchAuthRequest<TPayload, TResponse = void>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  return sendRequest<TResponse>("PATCH", endpoint, payload, options);
}

export async function deleteAuthRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<void> {
  await sendRequest<void>("DELETE", endpoint, NO_BODY, options);
}

// DELETE con cuerpo JSON (p. ej. DELETE /users/me con la confirmación).
export async function deleteAuthRequestWithBody<TPayload>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<void> {
  await sendRequest<void>("DELETE", endpoint, payload, options);
}

function isSafeRedirect(value: string | null | undefined): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

// Decide a dónde va el usuario tras autenticarse. Los roles de restaurante y
// admin tienen su destino fijo; los usuarios regulares pasan por complete-profile.
export function resolvePostAuthRoute(
  response: AuthResponse,
  redirectTo?: string | null,
): string {
  const safeRedirect = isSafeRedirect(redirectTo) ? redirectTo : null;

  if (response.role === "admin") {
    return safeRedirect ?? "/admin/dashboard";
  }

  if (response.role === "restaurant") {
    if (response.establishment_status === "APPROVED") {
      return safeRedirect ?? "/restaurant/dashboard";
    }
    return "/restaurant/status";
  }

  if (!response.registration_complete) {
    return "/complete-profile";
  }

  return safeRedirect ?? "/";
}

export async function exchangeGoogleCode(code: string): Promise<AuthResponse> {
  const response = await postAuthRequest<{ code: string }, AuthResponse>(
    AUTH_ENDPOINTS.googleExchange,
    { code },
  );

  if (!response) {
    throw new ApiError("No se recibieron datos de autenticación del servidor.", 500);
  }

  return rememberSessionCsrf(response);
}

// Las rutas que crean la sesión devuelven su token CSRF; se guarda antes de cualquier otra escritura.
export async function loginUser(payload: { email: string; password: string }): Promise<AuthResponse | undefined> {
  return rememberSessionCsrf(
    await postAuthRequest<typeof payload, AuthResponse>(AUTH_ENDPOINTS.login, payload),
  );
}

// Aceptación obligatoria de la política de datos y los términos (B8, sin casilla de edad: D10).
export type ConsentFields = {
  accept_privacy_policy: true;
  accept_terms: true;
  privacy_policy_version: string;
  terms_version: string;
};

export async function registerUser(payload: {
  full_name: string;
  nickname: string | null;
  email: string;
  phone_number: string;
  password: string;
} & ConsentFields): Promise<AuthResponse | undefined> {
  return rememberSessionCsrf(
    await postAuthRequest<typeof payload, AuthResponse>(AUTH_ENDPOINTS.register, payload),
  );
}

export async function logoutUser(): Promise<void> {
  try {
    await postAuthRequest(AUTH_ENDPOINTS.logout, {});
  } finally {
    clearCsrfToken();
  }
}
