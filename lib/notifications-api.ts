import type { Page } from "./api";
import { authEndpoint, deleteAuthRequest, getAuthRequest, postAuthRequest } from "./auth-api";

// Tipos que emite el backend (app/models/notification.py). Se acepta cualquier texto por si el
// backend añade uno nuevo antes que el frontend.
export type NotificationType =
  | "REVIEW_RECEIVED"
  | "REVIEW_REPLIED"
  | "REVIEW_PROMPT"
  | "CONTENT_MODERATED"
  | "CONTENT_RESTORED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REACTIVATED"
  | "ESTABLISHMENT_APPROVED"
  | "ESTABLISHMENT_REJECTED"
  | "ESTABLISHMENT_SUSPENDED"
  | "ESTABLISHMENT_REACTIVATED"
  | "ESTABLISHMENT_EDITED_BY_ADMIN"
  | "PLAN_REMINDER"
  | "PLAN_AFFECTED"
  | "REPORT_RESOLVED"
  | "ADMIN_REPORT_OPENED"
  | "ADMIN_MESSAGE";

export type AppNotification = {
  id: number;
  type: NotificationType | (string & {});
  title: string;
  body: string;
  // Ruta relativa del frontend, p. ej. "/plans/12".
  link: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  is_read: boolean;
};

const base = authEndpoint("/notifications");

export function listNotifications(
  { unreadOnly = false, skip = 0, limit = 20 }: { unreadOnly?: boolean; skip?: number; limit?: number } = {},
  options: RequestInit = {},
) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (unreadOnly) query.set("unread_only", "true");
  return getAuthRequest<Page<AppNotification>>(`${base}?${query.toString()}`, options);
}

export async function getUnreadCount(options: RequestInit = {}): Promise<number> {
  const response = await getAuthRequest<{ count: number }>(`${base}/unread-count`, options);
  return response?.count ?? 0;
}

export function markNotificationRead(notificationId: number) {
  return postAuthRequest<undefined, void>(`${base}/${notificationId}/read`, undefined);
}

export function markAllNotificationsRead() {
  return postAuthRequest<undefined, void>(`${base}/read-all`, undefined);
}

export function deleteNotification(notificationId: number) {
  return deleteAuthRequest(`${base}/${notificationId}`);
}

// Solo rutas internas: el enlace viene del backend, pero no se navega a otro sitio.
export function safeNotificationLink(link: string | null | undefined): string | null {
  return link && link.startsWith("/") && !link.startsWith("//") ? link : null;
}
