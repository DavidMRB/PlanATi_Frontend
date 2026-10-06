export const AUTH_ENDPOINTS = {
  login: "",
  register: "",
  profile: "",
  saveProfile: "",
  requestSms: "",
  verifySms: "",
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
