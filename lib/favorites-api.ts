import type { Page } from "./api";
import { ApiError, apiErrorCode, authEndpoint, deleteAuthRequest, getAuthRequest, putAuthRequest } from "./auth-api";
import type { PublicEstablishment } from "./establishments-api";

// Contratos de B7 (app/api/routes/favorites.py del backend). Solo cuentas `user` activas con el teléfono
// verificado (si no, 403 con `code` ROLE_NOT_ALLOWED o PHONE_NOT_VERIFIED). Un favorito de un local que deja
// de estar aprobado se conserva, pero no se lista hasta que vuelva a estarlo.

const base = authEndpoint("/favorites");

// Favoritos aprobados, el guardado más recientemente primero.
export function listFavorites({ skip = 0, limit = 20 }: { skip?: number; limit?: number } = {}, options: RequestInit = {}) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return getAuthRequest<Page<PublicEstablishment>>(`${base}?${query.toString()}`, options);
}

// Solo los ids, para marcar el corazón en las tarjetas del directorio, de inicio y del mapa.
export async function listFavoriteIds(options: RequestInit = {}): Promise<number[]> {
  const data = await getAuthRequest<{ establishment_ids: number[] }>(`${base}/ids`, options);
  return data?.establishment_ids ?? [];
}

// Idempotente (204). 404 si el local no existe o no está aprobado.
export function addFavorite(establishmentId: number) {
  return putAuthRequest<undefined>(`${base}/${establishmentId}`, undefined);
}

// Idempotente (204 aunque no fuera favorito).
export function removeFavorite(establishmentId: number) {
  return deleteAuthRequest(`${base}/${establishmentId}`);
}

export function favoriteErrorMessage(error: unknown): string {
  const code = apiErrorCode(error);
  if (code === "PHONE_NOT_VERIFIED") return "Verifica tu teléfono para guardar favoritos.";
  if (code === "ROLE_NOT_ALLOWED") return "Solo las cuentas de usuario pueden guardar favoritos.";
  if (error instanceof ApiError && error.status === 404) return "Este lugar ya no está disponible.";
  return error instanceof Error ? error.message : "No fue posible actualizar tus favoritos.";
}
