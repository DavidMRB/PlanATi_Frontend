import { authEndpoint, postAuthRequest } from "./auth-api";
import type { ReportReason, ReportTargetType } from "./admin-api";

export type { ReportReason, ReportTargetType };

// Motivos de reporte (app/services/report_service.py, REASON_LABELS).
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: "Spam o publicidad",
  OFFENSIVE: "Contenido ofensivo",
  FALSE_INFO: "Información falsa",
  INAPPROPRIATE_IMAGE: "Imagen inapropiada",
  OTHER: "Otro motivo",
};

export const REPORT_DETAILS_MAX = 1000;

export type CreatedReport = {
  id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  details: string | null;
  status: string;
  created_at: string;
};

// Cualquier cuenta activa puede reportar contenido visible que no sea suyo, una vez por destino.
// 409 = ya lo reportó; 429 = límite diario; 400 = contenido propio.
export function createReport(payload: {
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  details?: string | null;
}) {
  return postAuthRequest<typeof payload, CreatedReport>(authEndpoint("/reports"), payload);
}
