import type { Page } from "./api";
import {
  ApiError,
  apiErrorCode,
  authEndpoint,
  deleteAuthRequest,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
} from "./auth-api";
import { formatDateTime, googleCalendarUrl } from "./datetime";
import { formatCop } from "./format";

// Contratos de B6 (app/schemas/plan.py y app/api/routes/plans.py del backend). Las fechas llegan en UTC;
// las que se envían llevan offset (p. ej. "2026-11-20T19:30:00-05:00"; sin offset → 422).

export type PlanStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

// Minutos de antelación permitidos para el recordatorio (`ReminderMinutes` del backend).
export const REMINDER_OPTIONS = [15, 30, 60, 120, 1440] as const;
export type ReminderMinutes = (typeof REMINDER_OPTIONS)[number];

export const REMINDER_LABEL: Record<ReminderMinutes, string> = {
  15: "15 minutos antes",
  30: "30 minutos antes",
  60: "1 hora antes",
  120: "2 horas antes",
  1440: "1 día antes",
};

// Límites del backend (schemas/plan.py y settings PLAN_*).
export const PLAN_LIMITS = {
  maxItems: 30,
  maxQuantity: 99,
  maxPartySize: 50,
  titleMax: 120,
  notesMax: 1000,
  itemNotesMax: 200,
  minLeadMinutes: 15,
  maxDaysAhead: 365,
  // Rango máximo de GET /plans?from&to.
  maxRangeDays: 92,
} as const;

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  SCHEDULED: "Programado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

export type PlanEstablishment = {
  id: number;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  profile_image_url: string | null;
};

export type PlanListItem = {
  id: number;
  title: string;
  scheduled_at: string;
  party_size: number;
  status: PlanStatus;
  reminder_minutes_before: ReminderMinutes | null;
  reminder_at: string | null;
  total_amount: string;
  currency: string;
  // Número de líneas (platos o combos distintos).
  items_count: number;
  establishment: PlanEstablishment;
  created_at: string;
  updated_at: string;
};

export type PlanItem = {
  id: number;
  menu_item_id: number | null;
  // Nombre y precio congelados al planear.
  name: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
  notes: string | null;
  // Precio actual; null si el producto se borró o ya no está disponible.
  current_price: string | null;
  price_changed: boolean;
};

export type PlanDetail = PlanListItem & {
  notes: string | null;
  reminder_sent_at: string | null;
  items: PlanItem[];
  // false si el local ya no está aprobado (p. ej. suspendido).
  establishment_available: boolean;
  // Con los horarios actuales el local ya no abre a esa hora.
  outside_schedule: boolean;
  prices_changed: boolean;
};

export type PlanItemInput = { menu_item_id: number; quantity: number; notes?: string | null };

export type PlanCreatePayload = {
  establishment_id: number;
  scheduled_at: string;
  party_size: number;
  title?: string | null;
  notes?: string | null;
  reminder_minutes_before?: ReminderMinutes | null;
  items: PlanItemInput[];
};

// `items` (si llega) reemplaza la lista y recalcula el total con los precios actuales. `title` vacío o
// null vuelve al título por defecto. `establishment_id` no se puede cambiar.
export type PlanUpdatePayload = Partial<Omit<PlanCreatePayload, "establishment_id">>;

const base = authEndpoint("/plans");

export function createPlan(payload: PlanCreatePayload) {
  return postAuthRequest<PlanCreatePayload, PlanDetail>(base, payload);
}

// Con `from` y `to` (juntos, máx. 92 días): los planes de ese rango. Sin ellos: los próximos.
export function listPlans(
  {
    from,
    to,
    status,
    skip = 0,
    limit = 20,
  }: { from?: string; to?: string; status?: PlanStatus; skip?: number; limit?: number } = {},
  options: RequestInit = {},
) {
  const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (from && to) {
    query.set("from", from);
    query.set("to", to);
  }
  if (status) query.set("status", status);
  return getAuthRequest<Page<PlanListItem>>(`${base}?${query.toString()}`, options);
}

export function getPlan(planId: number, options: RequestInit = {}) {
  return getAuthRequest<PlanDetail>(`${base}/${planId}`, options);
}

export function updatePlan(planId: number, payload: PlanUpdatePayload) {
  return patchAuthRequest<PlanUpdatePayload, PlanDetail>(`${base}/${planId}`, payload);
}

export function cancelPlan(planId: number) {
  return postAuthRequest<undefined, PlanDetail>(`${base}/${planId}/cancel`, undefined);
}

export function deletePlan(planId: number) {
  return deleteAuthRequest(`${base}/${planId}`);
}

// Enlace directo al .ics (navegación real: Safari en iPhone solo ofrece "Añadir a Calendario" así).
// La cookie viaja porque API y frontend son el mismo sitio.
export function planIcsUrl(planId: number): string {
  return `${base}/${planId}/calendar.ics`;
}

// Un plan solo se edita o cancela si está programado y aún no pasó (si no, el backend responde 409).
export function isPlanEditable(plan: Pick<PlanListItem, "status" | "scheduled_at">, now = Date.now()): boolean {
  return plan.status === "SCHEDULED" && new Date(plan.scheduled_at).getTime() > now;
}

// Enlace "Agregar a Google Calendar" con los datos del plan (2 h de duración, sin alarma).
export function planGoogleCalendarUrl(plan: PlanDetail, planUrl?: string): string {
  const lines = [
    `${plan.party_size} ${plan.party_size === 1 ? "persona" : "personas"}`,
    ...plan.items.map((item) => `${item.quantity}× ${item.name}`),
  ];
  if (plan.items.length > 0) lines.push(`Total estimado: ${formatCop(plan.total_amount)}`);
  if (plan.notes) lines.push(plan.notes);
  if (planUrl) lines.push(`Ver el plan: ${planUrl}`);
  return googleCalendarUrl({
    title: plan.title,
    start: plan.scheduled_at,
    details: lines.join("\n"),
    location: `${plan.establishment.name}, ${plan.establishment.address}`,
  });
}

export function formatPlanDate(value: string): string {
  return formatDateTime(value, { year: undefined });
}

// Paso del asistente al que corresponde un error del backend.
export type PlanErrorStep = "when" | "menu" | "details" | "summary";

export function planErrorStep(error: unknown): PlanErrorStep {
  const code = apiErrorCode(error);
  if (code === "CLOSED") return "when";
  if (code === "INVALID_ITEMS") return "menu";
  if (code === "REMINDER_IN_PAST") return "details";
  if (error instanceof ApiError && /anticipación|días/.test(error.message)) return "when";
  return "summary";
}

// IDs de platos que el backend rechazó (`INVALID_ITEMS`).
export function invalidItemIds(error: unknown): number[] {
  if (!(error instanceof ApiError) || apiErrorCode(error) !== "INVALID_ITEMS") return [];
  const ids = (error.data as { invalid_item_ids?: unknown } | undefined)?.invalid_item_ids;
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === "number") : [];
}

export function planErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "No encontramos este plan o el establecimiento ya no está disponible.";
    if (error.status === 409) return "Este plan ya no se puede modificar: solo se editan planes programados que aún no han pasado.";
    if (apiErrorCode(error) === "PHONE_NOT_VERIFIED") return "Verifica tu teléfono para crear planes.";
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
