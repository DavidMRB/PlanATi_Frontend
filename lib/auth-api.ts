export const AUTH_ENDPOINTS = {
  login: "",
  register: "",
} as const;

export async function postAuthRequest<TPayload>(
  endpoint: string,
  payload: TPayload,
): Promise<void> {
  if (!endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
}
