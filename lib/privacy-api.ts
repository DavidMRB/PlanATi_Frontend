import {
  ApiError,
  apiErrorCode,
  authEndpoint,
  deleteAuthRequestWithBody,
  getAuthRequest,
  postAuthRequest,
  type UserProfile,
} from "./auth-api";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION, type LegalDocument } from "./legal";

// Contratos de B8 (app/api/routes/users.py y legal.py del backend; Ley 1581 de 2012).

export type LegalVersions = { privacy_policy: string; terms: string };

// Canales de app/models/privacy.py (CONSENT_CHANNELS).
export type ConsentChannel =
  | "WEB_REGISTER"
  | "RESTAURANT_REGISTER"
  | "GOOGLE_COMPLETE_PROFILE"
  | "RE_ACCEPTANCE"
  | (string & {});

export type ConsentItem = {
  id: number;
  document: LegalDocument;
  version: string;
  channel: ConsentChannel;
  accepted_at: string;
};

export const CONSENT_CHANNEL_LABEL: Record<string, string> = {
  WEB_REGISTER: "Al registrarte",
  RESTAURANT_REGISTER: "Al registrar el establecimiento",
  GOOGLE_COMPLETE_PROFILE: "Al completar tu perfil (Google)",
  RE_ACCEPTANCE: "Nueva versión aceptada",
};

const users = authEndpoint("/users/me");

export function getLegalVersions(options: RequestInit = {}) {
  return getAuthRequest<LegalVersions>(authEndpoint("/legal/versions"), options);
}

// Historial de aceptaciones, la más reciente primero.
export async function listMyConsents(options: RequestInit = {}): Promise<ConsentItem[]> {
  return (await getAuthRequest<ConsentItem[]>(`${users}/consents`, options)) ?? [];
}

// Acepta las versiones publicadas en /legal/* (lib/legal.ts): registra los dos documentos aunque solo uno
// estuviera pendiente. Idempotente. Responde el perfil actualizado.
export function acceptConsents() {
  return postAuthRequest<{ privacy_policy_version: string; terms_version: string }, UserProfile>(`${users}/consents`, {
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    terms_version: TERMS_VERSION,
  });
}

export type DataExportResult = { ok: true } | { ok: false; retryAfterSeconds: number | null; message: string };

// "Descargar mis datos": se pide con fetch (y no con un enlace) para poder avisar del límite de una
// descarga por hora (429 con `retry_after_seconds`) en vez de mostrar el JSON del error.
export async function downloadMyData(): Promise<DataExportResult> {
  try {
    const data = await getAuthRequest<unknown>(`${users}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mis-datos-planati.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      const seconds = (error.data as { retry_after_seconds?: unknown } | undefined)?.retry_after_seconds;
      const retry = typeof seconds === "number" ? seconds : null;
      const minutes = retry ? Math.max(1, Math.ceil(retry / 60)) : null;
      return {
        ok: false,
        retryAfterSeconds: retry,
        message: minutes
          ? `Ya descargaste tus datos hace poco. Podrás pedir otra copia en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`
          : "Ya descargaste tus datos hace poco. Inténtalo más tarde.",
      };
    }
    return { ok: false, retryAfterSeconds: null, message: error instanceof Error ? error.message : "No fue posible descargar tus datos." };
  }
}

// Código SMS para confirmar la eliminación (cuentas de Google, que no tienen contraseña).
export function sendDeleteAccountCode() {
  return postAuthRequest<undefined, { success: boolean; message: string }>(`${users}/delete/send-code`, undefined);
}

export type DeleteAccountPayload = { confirmation: "ELIMINAR" } & ({ password: string } | { code: string });

// 204 y cookie borrada. Solo rol `user` (restaurante y admin: 409 SUPPORT_REQUIRED).
export function deleteMyAccount(payload: DeleteAccountPayload) {
  return deleteAuthRequestWithBody(users, payload);
}

// Versión desactualizada: el texto que vio la persona ya no es el vigente.
export function isConsentVersionOutdated(error: unknown): boolean {
  return apiErrorCode(error) === "CONSENT_VERSION_OUTDATED";
}

export const CONSENT_OUTDATED_MESSAGE =
  "La política de datos o los términos cambiaron. Recarga la página para leer la versión vigente y aceptarla.";
