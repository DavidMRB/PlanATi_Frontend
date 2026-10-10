import { API_URL } from "./api";

export type AuthResponse = {
  access_token: string;
  token_type?: string;
  authenticated?: boolean;
  registration_complete?: boolean;
  requires_phone_verification?: boolean;
};

export function saveAuthSession(response: AuthResponse) {
  if (!response.access_token) {
    throw new Error("La respuesta de autenticación no contiene un token válido.");
  }

  localStorage.setItem("accessToken", response.access_token);
}

export function getAuthHeaders(): HeadersInit {
  const accessToken =
    typeof window === "undefined" ? null : localStorage.getItem("accessToken");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function authEndpoint(path: string) {
  return `${API_URL}${path}`;
}

export const AUTH_ENDPOINTS = {
  login: authEndpoint("/auth/login"),
  register: authEndpoint("/auth/register"),
  profile: authEndpoint("/users/me"),
  saveProfile: authEndpoint("/users/me"),
  requestSms: authEndpoint("/auth/phone/send-code"),
  verifySms: authEndpoint("/auth/phone/verify"),
} as const;

export async function getAuthRequest<TResponse = void>(
  endpoint: string,
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La solicitud falló con estado ${response.status}.`);
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
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `La solicitud falló con estado ${response.status}.`;

    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // The API may return an empty or non-JSON error response.
    }

    throw new Error(message);
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
): Promise<TResponse | undefined> {
  if (!endpoint) {
    return undefined;
  }

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `La solicitud falló con estado ${response.status}.`;

    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // The API may return an empty or non-JSON error response.
    }

    throw new Error(message);
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
