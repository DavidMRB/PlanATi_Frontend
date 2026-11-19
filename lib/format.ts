import type { EstablishmentStatus } from "./restaurant-api";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(value: number | string): string {
  return copFormatter.format(Number(value));
}

export const ESTABLISHMENT_STATUS_LABEL: Record<EstablishmentStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  SUSPENDED: "Suspendido",
};

export const ESTABLISHMENT_STATUS_CLASS: Record<EstablishmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-slate-200 text-slate-700",
};

// Estados de las cuentas de usuario.
export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa",
  PENDING_PHONE: "Sin verificar teléfono",
  SUSPENDED: "Suspendida",
};

export const USER_STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING_PHONE: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-slate-200 text-slate-700",
};

export const ROLE_LABEL: Record<string, string> = {
  user: "Usuario",
  restaurant: "Establecimiento",
  admin: "Administrador",
};

// Estados de una reseña y de su comentario (vista del admin).
export const REVIEW_STATUS_LABEL: Record<string, string> = { VISIBLE: "Visible", HIDDEN: "Oculta" };
export const COMMENT_STATUS_LABEL: Record<string, string> = { VISIBLE: "Publicado", BLOCKED: "Bloqueado" };
