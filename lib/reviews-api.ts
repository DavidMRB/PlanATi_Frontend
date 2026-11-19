import type { Page } from "./api";
import { apiErrorCode, ApiError, authEndpoint, deleteAuthRequest, getAuthRequest, patchAuthRequest, postAuthRequest } from "./auth-api";

// Contratos de B3 (app/schemas/review.py). El backend nunca envía el texto de un comentario bloqueado
// en la vista pública: llega `comment: null`, `comment_blocked: true` y el aviso en `moderation_notice`.

export type ReviewAuthor = {
  id: number;
  // Apodo o "Laura G."; nunca email ni nombre completo.
  display_name: string;
  picture: string | null;
};

export type ReviewImage = {
  id: number;
  image_url: string;
  display_order: number;
  created_at: string;
};

export type ReviewReply = {
  id: number;
  created_at: string;
  updated_at: string;
  comment: string | null;
  comment_blocked: boolean;
  moderation_notice: string | null;
};

export type Review = {
  id: number;
  establishment_id: number;
  rating: number;
  comment: string | null;
  comment_blocked: boolean;
  moderation_notice: string | null;
  created_at: string;
  edited_at: string | null;
  status: "VISIBLE" | "HIDDEN" | (string & {});
  author: ReviewAuthor;
  images: ReviewImage[];
  reply: ReviewReply | null;
};

// Vista del autor: `comment` es su texto original aunque esté bloqueado.
export type MyReview = Review & {
  comment_status: "VISIBLE" | "BLOCKED" | (string & {});
  moderation_category: string | null;
  moderation_reason: string | null;
  flagged_for_review: boolean;
  establishment: { id: number; name: string; profile_image_url: string | null };
};

// Conteo por estrellas: claves "1" … "5".
export type RatingDistribution = Record<string, number>;

export type ReviewSort = "recent" | "rating_desc" | "rating_asc";

export type ReviewBlockReason =
  | "LOGIN_REQUIRED"
  | "PHONE_NOT_VERIFIED"
  | "ROLE_NOT_ALLOWED"
  | "OWNER"
  | "ALREADY_REVIEWED"
  | "SUSPENDED";

export type ReviewPayload = {
  rating: number;
  comment: string | null;
  // Lista completa: al editar reemplaza las imágenes actuales.
  image_urls: string[];
};

// Etiquetas de las categorías de moderación (app/models/review.py, MODERATION_CATEGORIES).
export const MODERATION_CATEGORY_LABEL: Record<string, string> = {
  OFFENSIVE_LANGUAGE: "Lenguaje ofensivo o insultos",
  HATE_OR_DISCRIMINATION: "Discriminación o discurso de odio",
  PERSONAL_DATA: "Datos personales de terceros",
  SPAM_OR_ADVERTISING: "Spam o publicidad",
  FALSE_OR_MISLEADING: "Información falsa o engañosa",
  SEXUAL_OR_VIOLENT: "Contenido sexual o violento",
  ILLEGAL_CONTENT: "Contenido ilegal",
  OFF_TOPIC: "No relacionado con el lugar",
  OTHER: "Otro motivo",
};

export const REVIEW_COMMENT_MAX = 2000;
export const REVIEW_MAX_IMAGES = 5;

export const RATING_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

const base = authEndpoint("/reviews");

export function listEstablishmentReviews(
  establishmentId: number,
  {
    sort = "recent",
    rating,
    withPhotos = false,
    skip = 0,
    limit = 10,
  }: { sort?: ReviewSort; rating?: number | null; withPhotos?: boolean; skip?: number; limit?: number } = {},
  options: RequestInit = {},
) {
  const query = new URLSearchParams({ sort, skip: String(skip), limit: String(limit) });
  if (rating) query.set("rating", String(rating));
  if (withPhotos) query.set("with_photos", "true");
  return getAuthRequest<Page<Review>>(`${base}/establishments/${establishmentId}?${query.toString()}`, options);
}

export function createReview(establishmentId: number, payload: ReviewPayload) {
  return postAuthRequest<ReviewPayload, Review>(`${base}/establishments/${establishmentId}`, payload);
}

export function updateReview(reviewId: number, payload: Partial<ReviewPayload>) {
  return patchAuthRequest<Partial<ReviewPayload>, MyReview>(`${base}/${reviewId}`, payload);
}

export function deleteReview(reviewId: number) {
  return deleteAuthRequest(`${base}/${reviewId}`);
}

export function listMyReviews({ skip = 0, limit = 10 }: { skip?: number; limit?: number } = {}) {
  return getAuthRequest<Page<MyReview>>(`${base}/me?skip=${skip}&limit=${limit}`);
}

// Mensaje para el usuario según el error de la API de reseñas.
export function reviewErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Alcanzaste el límite diario de reseñas. Intenta mañana.";
    if (error.status === 409) return "Ya reseñaste este lugar. Puedes editar tu reseña.";
    if (apiErrorCode(error) === "HIDDEN") return "Esta reseña fue ocultada por moderación y no puede editarse.";
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
