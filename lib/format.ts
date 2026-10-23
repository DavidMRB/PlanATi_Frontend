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
};

export const ESTABLISHMENT_STATUS_CLASS: Record<EstablishmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};
