import {
  authEndpoint,
  deleteAuthRequest,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
  putAuthRequest,
  type ConsentFields,
} from "./auth-api";
import { rememberSessionCsrf } from "./csrf";
import type { Page } from "./api";
import type { EstablishmentSchedule, EstablishmentType, LocationSource } from "./establishments-api";
import type { RatingDistribution, Review } from "./reviews-api";

export type EstablishmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ImageType = "GALLERY" | "MENU";
// Valores aceptados por el backend en /restaurant/upload-url (enum `folder`).
export type UploadFolder = "establishments" | "menu" | "products";

// Ubicación del local (B2). Latitud y longitud van juntas; el backend las redondea a 6 decimales
// y responde 400 si quedan fuera del área de servicio.
export type EstablishmentLocationFields = {
  latitude: number;
  longitude: number;
  location_source?: LocationSource | null;
  google_place_id?: string | null;
  city?: string | null;
};

export type RestaurantRegisterPayload = EstablishmentLocationFields & {
  account_email: string;
  password: string;
  manager_name: string;
  establishment_name: string;
  category: string;
  address: string;
  establishment_phone: string;
  contact_email: string;
  description: string;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  establishment_type?: EstablishmentType;
} & ConsentFields;

export type RestaurantRegisterResponse = {
  user_id: number;
  establishment_id: number;
  role: string;
  establishment_status: EstablishmentStatus;
  message: string;
  csrf_token?: string;
};

export type RestaurantStatus = {
  establishment_id: number;
  name: string;
  category: string;
  address: string;
  status: EstablishmentStatus;
  rejection_reason: string | null;
  // Motivo de la suspensión (B5); el local suspendido no puede re-aplicar.
  suspension_reason?: string | null;
};

export type RestaurantProfileUpdate = {
  name?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  contact_email?: string | null;
  description?: string | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  manager_name?: string | null;
  // Si se envían, van juntas y no pueden ser nulas (la ubicación es obligatoria).
  latitude?: number;
  longitude?: number;
  location_source?: LocationSource | null;
  google_place_id?: string | null;
  city?: string | null;
  establishment_type?: EstablishmentType;
  price_range?: string | null;
};

export type RestaurantProfile = {
  id: number;
  owner_id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  price_range: string | null;
  status: EstablishmentStatus;
  phone: string | null;
  contact_email: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  manager_name: string | null;
  created_at: string;
  establishment_type: EstablishmentType | (string & {});
  city: string | null;
  location_source: LocationSource | null;
  google_place_id: string | null;
  rating_avg: number | null;
  rating_count: number;
};

export type UploadUrl = {
  upload_url: string;
  public_url: string;
  key: string;
};

export type EstablishmentImage = {
  id: number;
  image_url: string;
  image_type: ImageType;
  caption: string | null;
  display_order: number;
};

export type ComboItem = {
  product_id: number;
  quantity: number;
  product_name: string | null;
};

// Productos y combos comparten el mismo modelo: `is_combo` los distingue.
export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_combo: boolean;
  is_available: boolean;
  combo_items: ComboItem[];
};

export type ProductPayload = {
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  is_available?: boolean;
};

export type ComboPayload = ProductPayload & {
  items: Array<{ product_id: number; quantity: number }>;
};

const base = authEndpoint("/restaurant");

// El registro crea la sesión: su token CSRF se guarda antes de subir el logo y la portada.
export async function registerRestaurant(payload: RestaurantRegisterPayload) {
  return rememberSessionCsrf(
    await postAuthRequest<RestaurantRegisterPayload, RestaurantRegisterResponse>(
      authEndpoint("/auth/restaurant/register"),
      payload,
    ),
  );
}

export function getRestaurantStatus() {
  return getAuthRequest<RestaurantStatus>(`${base}/status`);
}

export function reapplyRestaurant(payload: RestaurantProfileUpdate) {
  return patchAuthRequest<RestaurantProfileUpdate, { status: EstablishmentStatus; message: string }>(
    `${base}/reapply`,
    payload,
  );
}

export function getRestaurantProfile() {
  return getAuthRequest<RestaurantProfile>(`${base}/profile`);
}

export function updateRestaurantProfile(payload: RestaurantProfileUpdate) {
  return patchAuthRequest<RestaurantProfileUpdate, RestaurantProfile>(`${base}/profile`, payload);
}

// fileExtension incluye el punto, por ejemplo ".png".
export function createUploadUrl(folder: UploadFolder, fileExtension: string) {
  const query = new URLSearchParams({ folder, file_extension: fileExtension });
  return postAuthRequest<undefined, UploadUrl>(`${base}/upload-url?${query}`, undefined);
}

export function listRestaurantImages(imageType?: ImageType) {
  const query = imageType ? `?image_type=${imageType}` : "";
  return getAuthRequest<EstablishmentImage[]>(`${base}/images${query}`);
}

export function createRestaurantImage(payload: {
  image_url: string;
  image_type: ImageType;
  caption?: string | null;
  display_order?: number;
}) {
  return postAuthRequest<typeof payload, EstablishmentImage>(`${base}/images`, payload);
}

export function deleteRestaurantImage(imageId: number) {
  return deleteAuthRequest(`${base}/images/${imageId}`);
}

export function listProducts() {
  return getAuthRequest<MenuItem[]>(`${base}/products`);
}

export function createProduct(payload: ProductPayload) {
  return postAuthRequest<ProductPayload, MenuItem>(`${base}/products`, payload);
}

export function updateProduct(productId: number, payload: Partial<ProductPayload>) {
  return patchAuthRequest<Partial<ProductPayload>, MenuItem>(
    `${base}/products/${productId}`,
    payload,
  );
}

export function deleteProduct(productId: number) {
  return deleteAuthRequest(`${base}/products/${productId}`);
}

export function createCombo(payload: ComboPayload) {
  return postAuthRequest<ComboPayload, MenuItem>(`${base}/combos`, payload);
}

export function updateCombo(comboId: number, payload: Partial<ComboPayload>) {
  return patchAuthRequest<Partial<ComboPayload>, MenuItem>(`${base}/combos/${comboId}`, payload);
}

export function deleteCombo(comboId: number) {
  return deleteAuthRequest(`${base}/combos/${comboId}`);
}

// --- Reseñas del establecimiento (B4). Solo reseñas visibles; un comentario bloqueado llega como
// `comment: null` + `moderation_notice`, pero se puede responder a la calificación.

export type ReplyFilter = "all" | "unanswered" | "answered";
export type RestaurantReviewSort = "recent" | "rating_asc";

export type RestaurantReviewSummary = {
  rating_avg: number | null;
  rating_count: number;
  ranking_score: number | null;
  category_rank: number | null;
  distribution: RatingDistribution;
  unanswered_count: number;
  // 0..1; null si aún no hay reseñas.
  response_rate: number | null;
};

export const REPLY_MAX_LENGTH = 1000;

export function listRestaurantReviews(
  {
    status = "all",
    rating,
    sort = "recent",
    skip = 0,
    limit = 10,
  }: { status?: ReplyFilter; rating?: number | null; sort?: RestaurantReviewSort; skip?: number; limit?: number } = {},
  options: RequestInit = {},
) {
  const query = new URLSearchParams({ status, sort, skip: String(skip), limit: String(limit) });
  if (rating) query.set("rating", String(rating));
  return getAuthRequest<Page<Review>>(`${base}/reviews?${query}`, options);
}

export function getRestaurantReviewSummary() {
  return getAuthRequest<RestaurantReviewSummary>(`${base}/reviews/summary`);
}

// Crea o actualiza la respuesta (idempotente) y devuelve la reseña completa con su respuesta.
export function upsertReviewReply(reviewId: number, comment: string) {
  return putAuthRequest<{ comment: string }, Review>(`${base}/reviews/${reviewId}/reply`, { comment });
}

export function deleteReviewReply(reviewId: number) {
  return deleteAuthRequest(`${base}/reviews/${reviewId}/reply`);
}

// Avisa al layout del panel (contador de "sin responder") de que cambió una respuesta.
export const RESTAURANT_REVIEWS_CHANGED = "planati:restaurant-reviews-changed";

// --- Horarios (B4). Hora local de Colombia; `PUT` reemplaza la semana completa y `[]` la deja sin horarios.
// Se envían en "HH:MM" y llegan como "HH:MM:SS".

export type ScheduleInput = { day_of_week: number; opening_time: string; closing_time: string };

export function getSchedules() {
  return getAuthRequest<EstablishmentSchedule[]>(`${base}/schedules`);
}

export function putSchedules(schedules: ScheduleInput[]) {
  return putAuthRequest<ScheduleInput[], EstablishmentSchedule[]>(`${base}/schedules`, schedules);
}
