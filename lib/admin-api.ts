import { authEndpoint, getAuthRequest, postAuthRequest } from "./auth-api";
import type { EstablishmentImage, EstablishmentStatus } from "./restaurant-api";

export type AdminDashboard = {
  users_count: number;
  establishments_count: number;
  reviews_count: number;
};

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
};

export type AdminEstablishmentDetail = AdminEstablishmentListItem & {
  description: string;
  rejection_reason: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  owner_full_name: string;
  owner_status: string;
  images: EstablishmentImage[];
};

export type EstablishmentDecision = {
  id: number;
  status: "APPROVED" | "REJECTED";
  rejection_reason: string | null;
  message: string;
};

const base = authEndpoint("/admin");

export function getAdminDashboard() {
  return getAuthRequest<AdminDashboard>(`${base}/dashboard`);
}

export function listAdminEstablishments(params: {
  status?: EstablishmentStatus;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const serialized = query.toString();
  const suffix = serialized ? `?${serialized}` : "";
  return getAuthRequest<AdminEstablishmentListItem[]>(`${base}/establishments${suffix}`);
}

export function getAdminEstablishment(establishmentId: number) {
  return getAuthRequest<AdminEstablishmentDetail>(`${base}/establishments/${establishmentId}`);
}

export function approveEstablishment(establishmentId: number) {
  return postAuthRequest<undefined, EstablishmentDecision>(
    `${base}/establishments/${establishmentId}/approve`,
    undefined,
  );
}

export function rejectEstablishment(establishmentId: number, reason: string) {
  return postAuthRequest<{ reason: string }, EstablishmentDecision>(
    `${base}/establishments/${establishmentId}/reject`,
    { reason },
  );
}
