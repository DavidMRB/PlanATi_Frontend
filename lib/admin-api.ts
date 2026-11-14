import type { Page } from "./api";
import { authEndpoint, deleteAuthRequest, getAuthRequest, patchAuthRequest, postAuthRequest } from "./auth-api";
import type { EstablishmentType, LocationSource } from "./establishments-api";
import type { EstablishmentImage, EstablishmentStatus, RestaurantProfileUpdate } from "./restaurant-api";
import type { ReviewImage } from "./reviews-api";

// Contratos de la consola admin (B5, app/schemas/admin.py). El admin siempre ve el texto original de
// reseñas y respuestas, aunque estén bloqueados.

// Motivo obligatorio de suspensiones, borrados y rechazos.
export const REASON_MIN = 5;
export const REASON_MAX = 1000;

export type ModerationCategory =
  | "OFFENSIVE_LANGUAGE"
  | "HATE_OR_DISCRIMINATION"
  | "PERSONAL_DATA"
  | "SPAM_OR_ADVERTISING"
  | "FALSE_OR_MISLEADING"
  | "SEXUAL_OR_VIOLENT"
  | "ILLEGAL_CONTENT"
  | "OFF_TOPIC"
  | "OTHER";

// --- Dashboard

export type AdminDashboard = {
  users_count: number;
  establishments_count: number;
  reviews_count: number;
  pending_establishments: number;
  suspended_establishments: number;
  suspended_users: number;
  open_reports: number;
  hidden_reviews: number;
  // Comentarios de reseñas y respuestas bloqueados.
  blocked_comments: number;
  // Reseñas (o sus respuestas) reescritas tras un bloqueo.
  flagged_for_review: number;
  reviews_last_7_days: number;
  scheduled_plans: number;
  establishments_without_location: number;
};

// --- Usuarios

export type UserRole = "user" | "restaurant" | "admin";
export type UserStatus = "ACTIVE" | "PENDING_PHONE" | "SUSPENDED";

export type AdminUserListItem = {
  id: number;
  full_name: string;
  nickname: string | null;
  email: string;
  role: UserRole | (string & {});
  picture: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  status: UserStatus | (string & {});
  created_at: string;
  google_sub: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  reviews_count: number;
  open_reports_count: number;
  // Solo cuentas `restaurant`: para ofrecer suspender también el local.
  establishment_id: number | null;
};

export type ReportSummary = {
  id: number;
  reporter_id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason | (string & {});
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED" | (string & {});
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
};

export type ModerationActionItem = {
  id: number;
  admin_id: number | null;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: number;
  reason: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type AdminReply = {
  id: number;
  comment: string;
  comment_status: "VISIBLE" | "BLOCKED" | (string & {});
  moderation_category: string | null;
  moderation_reason: string | null;
  flagged_for_review: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminReview = {
  id: number;
  establishment: { id: number; name: string; status: string };
  author: { id: number; display_name: string; full_name: string; email: string; status: string; picture: string | null };
  rating: number;
  comment: string | null;
  status: "VISIBLE" | "HIDDEN" | (string & {});
  comment_status: "VISIBLE" | "BLOCKED" | (string & {});
  moderation_category: string | null;
  moderation_reason: string | null;
  flagged_for_review: boolean;
  created_at: string;
  edited_at: string | null;
  images: ReviewImage[];
  reply: AdminReply | null;
  open_reports_count: number;
};

export type AdminUserDetail = AdminUserListItem & {
  establishments: Array<{ id: number; name: string; status: EstablishmentStatus }>;
  recent_reviews: AdminReview[];
  reports_received: ReportSummary[];
  moderation_history: ModerationActionItem[];
};

// --- Establecimientos

export type AdminEstablishmentListItem = {
  id: number;
  name: string;
  category: string;
  address: string;
  owner_id: number;
  owner_email: string;
  manager_name: string | null;
  phone: string | null;
  contact_email: string | null;
  status: EstablishmentStatus;
  created_at: string;
  establishment_type: EstablishmentType;
  city: string | null;
  rating_avg: number | null;
  rating_count: number;
  has_location: boolean;
  open_reports_count: number;
  suspension_reason: string | null;
};

export type AdminEstablishmentDetail = AdminEstablishmentListItem & {
  description: string;
  rejection_reason: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  owner_full_name: string;
  owner_status: string;
  images: EstablishmentImage[];
  // Decimales serializados como texto.
  latitude: string | null;
  longitude: string | null;
  location_source: LocationSource | null;
  google_place_id: string | null;
  price_range: string | null;
  ranking_score: number | null;
};

export type EstablishmentDecision = {
  id: number;
  status: "APPROVED" | "REJECTED" | "SUSPENDED";
  rejection_reason: string | null;
  suspension_reason: string | null;
  message: string;
  // Avisos que no impiden la decisión (p. ej. sin ubicación no aparecerá en el mapa).
  warnings: string[];
};

export type AdminEstablishmentUpdate = RestaurantProfileUpdate & { reason?: string | null };

// --- Reportes

export type ReportTargetType =
  | "REVIEW"
  | "REVIEW_REPLY"
  | "REVIEW_IMAGE"
  | "ESTABLISHMENT"
  | "ESTABLISHMENT_IMAGE"
  | "MENU_ITEM"
  | "USER";
export type ReportReason = "SPAM" | "OFFENSIVE" | "FALSE_INFO" | "INAPPROPRIATE_IMAGE" | "OTHER";
export type ReportStatusFilter = "OPEN" | "RESOLVED" | "DISMISSED" | "ALL";
export type ResolveAction = "NONE" | "BLOCK_COMMENT" | "HIDE_CONTENT" | "DELETE_CONTENT" | "SUSPEND_OWNER";

export type ReportTargetPreview = {
  exists: boolean;
  visible: boolean;
  owner_id: number | null;
  establishment_id: number | null;
  name: string | null;
  // Texto original (el admin lo ve aunque esté bloqueado).
  text: string | null;
  image_url: string | null;
  rating: number | null;
  status: string | null;
  comment_status: string | null;
  owner_name: string | null;
  review_id: number | null;
  establishment_name: string | null;
  is_available: boolean | null;
};

export type AdminReport = ReportSummary & {
  reporter_name: string | null;
  reporter_email: string | null;
  resolved_by_id: number | null;
  reports_on_target: number;
  preview: ReportTargetPreview;
};

// Acciones que admite cada tipo de destino al resolver (tabla de la sección 7.5 del plan del backend).
export const RESOLVE_ACTIONS_BY_TARGET: Record<ReportTargetType, ResolveAction[]> = {
  REVIEW: ["NONE", "BLOCK_COMMENT", "HIDE_CONTENT", "DELETE_CONTENT", "SUSPEND_OWNER"],
  REVIEW_REPLY: ["NONE", "BLOCK_COMMENT", "DELETE_CONTENT", "SUSPEND_OWNER"],
  REVIEW_IMAGE: ["NONE", "HIDE_CONTENT", "SUSPEND_OWNER"],
  ESTABLISHMENT: ["NONE", "HIDE_CONTENT", "SUSPEND_OWNER"],
  ESTABLISHMENT_IMAGE: ["NONE", "HIDE_CONTENT", "SUSPEND_OWNER"],
  MENU_ITEM: ["NONE", "HIDE_CONTENT", "DELETE_CONTENT", "SUSPEND_OWNER"],
  USER: ["NONE", "HIDE_CONTENT"],
};

// Qué hace cada acción según el destino.
export const RESOLVE_ACTION_LABEL: Record<ReportTargetType, Partial<Record<ResolveAction, string>>> = {
  REVIEW: {
    NONE: "Sin acción (cerrar el reporte)",
    BLOCK_COMMENT: "Bloquear el comentario",
    HIDE_CONTENT: "Ocultar la reseña",
    DELETE_CONTENT: "Eliminar la reseña",
    SUSPEND_OWNER: "Suspender al autor",
  },
  REVIEW_REPLY: {
    NONE: "Sin acción (cerrar el reporte)",
    BLOCK_COMMENT: "Bloquear la respuesta",
    DELETE_CONTENT: "Eliminar la respuesta",
    SUSPEND_OWNER: "Suspender el establecimiento",
  },
  REVIEW_IMAGE: {
    NONE: "Sin acción (cerrar el reporte)",
    HIDE_CONTENT: "Borrar la imagen",
    SUSPEND_OWNER: "Suspender al autor",
  },
  ESTABLISHMENT: {
    NONE: "Sin acción (cerrar el reporte)",
    HIDE_CONTENT: "Suspender el establecimiento",
    SUSPEND_OWNER: "Suspender la cuenta dueña",
  },
  ESTABLISHMENT_IMAGE: {
    NONE: "Sin acción (cerrar el reporte)",
    HIDE_CONTENT: "Borrar la imagen",
    SUSPEND_OWNER: "Suspender el establecimiento",
  },
  MENU_ITEM: {
    NONE: "Sin acción (cerrar el reporte)",
    HIDE_CONTENT: "Marcar como no disponible",
    DELETE_CONTENT: "Eliminar el producto",
    SUSPEND_OWNER: "Suspender el establecimiento",
  },
  USER: {
    NONE: "Sin acción (cerrar el reporte)",
    HIDE_CONTENT: "Suspender al usuario",
  },
};

// --- Bitácora

export const MODERATION_ACTION_LABEL: Record<string, string> = {
  HIDE_REVIEW: "Ocultó una reseña",
  RESTORE_REVIEW: "Restauró una reseña",
  DELETE_REVIEW: "Eliminó una reseña",
  BLOCK_COMMENT: "Bloqueó un comentario",
  UNBLOCK_COMMENT: "Desbloqueó un comentario",
  BLOCK_REPLY: "Bloqueó una respuesta",
  UNBLOCK_REPLY: "Desbloqueó una respuesta",
  DELETE_REPLY: "Eliminó una respuesta",
  DELETE_REVIEW_IMAGE: "Borró una foto de reseña",
  DELETE_ESTABLISHMENT_IMAGE: "Borró una foto de establecimiento",
  HIDE_MENU_ITEM: "Ocultó un producto",
  DELETE_MENU_ITEM: "Eliminó un producto",
  SUSPEND_USER: "Suspendió una cuenta",
  REACTIVATE_USER: "Reactivó una cuenta",
  CHANGE_ROLE: "Cambió un rol",
  SUSPEND_ESTABLISHMENT: "Suspendió un establecimiento",
  REACTIVATE_ESTABLISHMENT: "Reactivó un establecimiento",
  EDIT_ESTABLISHMENT: "Editó un establecimiento",
  EDIT_CATALOG: "Editó un catálogo",
  RESOLVE_REPORT: "Resolvió un reporte",
  DISMISS_REPORT: "Descartó un reporte",
  NOTIFY_USER: "Envió un aviso",
};

export const TARGET_TYPE_LABEL: Record<string, string> = {
  REVIEW: "Reseña",
  REVIEW_REPLY: "Respuesta",
  REVIEW_IMAGE: "Foto de reseña",
  ESTABLISHMENT: "Establecimiento",
  ESTABLISHMENT_IMAGE: "Foto de establecimiento",
  MENU_ITEM: "Producto",
  USER: "Usuario",
  REPORT: "Reporte",
};

const base = authEndpoint("/admin");

function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export function getAdminDashboard() {
  return getAuthRequest<AdminDashboard>(`${base}/dashboard`);
}

// --- Usuarios

export function listAdminUsers(params: {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  skip?: number;
  limit?: number;
}) {
  return getAuthRequest<Page<AdminUserListItem>>(`${base}/users${query(params)}`);
}

export function getAdminUser(userId: number) {
  return getAuthRequest<AdminUserDetail>(`${base}/users/${userId}`);
}

export function updateUserRole(userId: number, role: UserRole) {
  return patchAuthRequest<{ role: UserRole }, AdminUserListItem>(`${base}/users/${userId}/role`, { role });
}

export function suspendUser(userId: number, reason: string) {
  return postAuthRequest<{ reason: string }, AdminUserListItem>(`${base}/users/${userId}/suspend`, { reason });
}

export function reactivateUser(userId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, AdminUserListItem>(`${base}/users/${userId}/reactivate`, {
    note: note || null,
  });
}

export function notifyUser(userId: number, payload: { title: string; body: string; link?: string | null }) {
  return postAuthRequest<typeof payload, void>(`${base}/users/${userId}/notify`, payload);
}

// --- Establecimientos

export function listAdminEstablishments(params: {
  status?: EstablishmentStatus;
  search?: string;
  skip?: number;
  limit?: number;
}) {
  return getAuthRequest<AdminEstablishmentListItem[]>(`${base}/establishments${query(params)}`);
}

export function getAdminEstablishment(establishmentId: number) {
  return getAuthRequest<AdminEstablishmentDetail>(`${base}/establishments/${establishmentId}`);
}

export function approveEstablishment(establishmentId: number) {
  return postAuthRequest<undefined, EstablishmentDecision>(`${base}/establishments/${establishmentId}/approve`, undefined);
}

export function rejectEstablishment(establishmentId: number, reason: string) {
  return postAuthRequest<{ reason: string }, EstablishmentDecision>(`${base}/establishments/${establishmentId}/reject`, {
    reason,
  });
}

export function suspendEstablishment(establishmentId: number, reason: string) {
  return postAuthRequest<{ reason: string }, EstablishmentDecision>(`${base}/establishments/${establishmentId}/suspend`, {
    reason,
  });
}

export function reactivateEstablishment(establishmentId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, EstablishmentDecision>(
    `${base}/establishments/${establishmentId}/reactivate`,
    { note: note || null },
  );
}

// --- Reseñas

export type AdminReviewFilters = {
  status?: "VISIBLE" | "HIDDEN" | "ALL";
  comment_status?: "VISIBLE" | "BLOCKED";
  flagged_for_review?: boolean;
  establishment_id?: number;
  user_id?: number;
  rating?: number;
  has_reports?: boolean;
  search?: string;
  sort?: "recent" | "most_reported";
  skip?: number;
  limit?: number;
};

export function listAdminReviews(filters: AdminReviewFilters) {
  return getAuthRequest<Page<AdminReview>>(`${base}/reviews${query(filters)}`);
}

export function blockReviewComment(
  reviewId: number,
  payload: { category: ModerationCategory; note?: string | null; remove_images?: boolean },
) {
  return postAuthRequest<typeof payload, AdminReview>(`${base}/reviews/${reviewId}/block-comment`, payload);
}

export function unblockReviewComment(reviewId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, AdminReview>(`${base}/reviews/${reviewId}/unblock-comment`, {
    note: note || null,
  });
}

export function hideReview(reviewId: number, payload: { category: ModerationCategory; reason?: string | null }) {
  return postAuthRequest<typeof payload, AdminReview>(`${base}/reviews/${reviewId}/hide`, payload);
}

export function restoreReview(reviewId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, AdminReview>(`${base}/reviews/${reviewId}/restore`, { note: note || null });
}

export function deleteReviewAsAdmin(reviewId: number, reason: string) {
  return deleteAuthRequest(`${base}/reviews/${reviewId}${query({ reason })}`);
}

export function blockReply(replyId: number, payload: { category: ModerationCategory; note?: string | null }) {
  return postAuthRequest<typeof payload, AdminReview>(`${base}/review-replies/${replyId}/block`, payload);
}

export function unblockReply(replyId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, AdminReview>(`${base}/review-replies/${replyId}/unblock`, {
    note: note || null,
  });
}

export function deleteReviewImage(imageId: number, reason: string) {
  return deleteAuthRequest(`${base}/review-images/${imageId}${query({ reason })}`);
}

// --- Reportes

export function listReports(params: {
  status?: ReportStatusFilter;
  target_type?: ReportTargetType;
  reason?: ReportReason;
  skip?: number;
  limit?: number;
}) {
  return getAuthRequest<Page<AdminReport>>(`${base}/reports${query(params)}`);
}

export function resolveReport(
  reportId: number,
  payload: { action: ResolveAction; category?: ModerationCategory | null; note?: string | null },
) {
  return postAuthRequest<typeof payload, AdminReport>(`${base}/reports/${reportId}/resolve`, payload);
}

export function dismissReport(reportId: number, note?: string | null) {
  return postAuthRequest<{ note: string | null }, AdminReport>(`${base}/reports/${reportId}/dismiss`, { note: note || null });
}

// --- Bitácora

export function listModerationActions(params: {
  admin_id?: number;
  action?: string;
  target_type?: string;
  target_id?: number;
  skip?: number;
  limit?: number;
}) {
  return getAuthRequest<Page<ModerationActionItem>>(`${base}/moderation-actions${query(params)}`);
}

// Avisa al layout admin de que cambiaron los contadores del menú (reportes abiertos, solicitudes).
export const ADMIN_COUNTS_CHANGED = "planati:admin-counts-changed";

export function announceAdminCountsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ADMIN_COUNTS_CHANGED));
}
