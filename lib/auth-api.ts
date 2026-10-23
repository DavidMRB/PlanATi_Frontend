import { API_URL } from "./api";

export type AuthResponse = {
  registration_complete: boolean;
  requires_phone_verification: boolean;
  authenticated?: boolean;
  role?: string | null;
  establishment_status?: string | null;
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
          message = first.msg;
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

export async function getAuthRequest<TResponse = void>(
  endpoint: string,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      `La solicitud falló con estado ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as TResponse;
}

export async function postAuthRequest<TPayload, TResponse = void>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      `La solicitud falló con estado ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as TResponse;
}

export async function patchAuthRequest<TPayload, TResponse = void>(
  endpoint: string,
  payload: TPayload,
  options: RequestInit = {},
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "PATCH",
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      `La solicitud falló con estado ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as TResponse;
}

export async function deleteAuthRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<void> {
  if (!endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: "DELETE",
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      `La solicitud falló con estado ${response.status}.`,
    );
  }
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

  return response;
}

export async function logoutUser(): Promise<void> {
  await postAuthRequest(AUTH_ENDPOINTS.logout, {});
}
