import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toBogotaIso, toDateKey, toTimeKey } from "@/lib/datetime";
import { getEstablishmentDetail, type PublicEstablishmentDetail } from "@/lib/establishments-api";
import {
  createPlan,
  formatPlanDate,
  invalidItemIds,
  PLAN_LIMITS,
  planErrorMessage,
  planErrorStep,
  updatePlan,
  type PlanDetail,
  type PlanErrorStep,
  type PlanItemInput,
  type PlanUpdatePayload,
  type ReminderMinutes,
} from "@/lib/plans-api";
import type { MenuItem } from "@/lib/restaurant-api";
import type { Selection } from "./MenuItemPicker";
import type { SummaryLine } from "./PlanSummary";
import { reminderStillValid } from "./ReminderSelect";
import { earliestPlanTime, lastPlanDateKey, slotsForDate, slotTimestamp } from "./slots";

export type BuilderStep = PlanErrorStep;
export const STEPS: Array<{ id: BuilderStep; label: string }> = [
  { id: "when", label: "Fecha y hora" },
  { id: "menu", label: "Menú" },
  { id: "details", label: "Detalles" },
  { id: "summary", label: "Resumen" },
];

type Mode = { kind: "create"; establishmentId: number } | { kind: "edit"; plan: PlanDetail };

function selectionFromPlan(plan: PlanDetail): Selection {
  const selection: Selection = {};
  for (const item of plan.items) {
    if (item.menu_item_id === null) continue;
    selection[item.menu_item_id] = { quantity: item.quantity, notes: item.notes ?? "" };
  }
  return selection;
}

function selectionPayload(selection: Selection): PlanItemInput[] {
  return Object.entries(selection).map(([id, { quantity, notes }]) => ({
    menu_item_id: Number(id),
    quantity,
    notes: notes.trim() || null,
  }));
}

// Estado, validación y envío del asistente de planes (crear y editar). El total real lo calcula el backend
// con los precios actuales; aquí solo se estima.
export function usePlanBuilder(mode: Mode) {
  const router = useRouter();
  const editing = mode.kind === "edit" ? mode.plan : null;
  const establishmentId = mode.kind === "edit" ? mode.plan.establishment.id : mode.establishmentId;

  const [detail, setDetail] = useState<PublicEstablishmentDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const [step, setStep] = useState<BuilderStep>("when");
  const [date, setDate] = useState(() => (editing ? toDateKey(editing.scheduled_at) : ""));
  const [time, setTime] = useState(() => (editing ? toTimeKey(editing.scheduled_at) : ""));
  const [selection, setSelectionState] = useState<Selection>(() => (editing ? selectionFromPlan(editing) : {}));
  const [itemsTouched, setItemsTouched] = useState(false);
  const [partySize, setPartySize] = useState(() => String(editing?.party_size ?? 2));
  const [title, setTitle] = useState(() => editing?.title ?? "");
  const [notes, setNotes] = useState(() => editing?.notes ?? "");
  const [reminder, setReminder] = useState<ReminderMinutes | null>(() =>
    editing ? editing.reminder_minutes_before : 60,
  );
  const [errors, setErrors] = useState<Partial<Record<BuilderStep, string>>>({});
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEstablishmentDetail(establishmentId)
      .then((data) => {
        if (!cancelled) setDetail(data ?? null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(planErrorMessage(error, "No fue posible cargar el establecimiento."));
      });
    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  // Las franjas que ya pasaron desaparecen sin recargar la página.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const catalog = useMemo(() => {
    const map = new Map<number, MenuItem>();
    for (const item of [...(detail?.products ?? []), ...(detail?.combos ?? [])]) if (item.is_available) map.set(item.id, item);
    return map;
  }, [detail]);

  // Ítems del plan que ya no están en la carta (se avisan y no se reenvían).
  const missingIds = useMemo(
    () => (detail ? Object.keys(selection).map(Number).filter((id) => !catalog.has(id)) : []),
    [catalog, detail, selection],
  );
  const invalidIds = useMemo(() => [...new Set([...missingIds, ...rejectedIds])], [missingIds, rejectedIds]);

  const lines: SummaryLine[] = useMemo(() => {
    if (editing && !itemsTouched) {
      return editing.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, unitPrice: Number(item.unit_price) }));
    }
    return Object.entries(selection).flatMap(([id, { quantity }]) => {
      const item = catalog.get(Number(id));
      return item ? [{ id: item.id, name: item.name, quantity, unitPrice: Number(item.price) }] : [];
    });
  }, [catalog, editing, itemsTouched, selection]);

  const schedules = useMemo(() => detail?.schedules ?? [], [detail]);
  const scheduledAt = date && time ? slotTimestamp(date, time) : null;
  const unchangedTime = editing !== null && scheduledAt === new Date(editing.scheduled_at).getTime();
  const whenLabel = scheduledAt !== null ? formatPlanDate(new Date(scheduledAt).toISOString()) : null;

  const setSelection = (next: Selection) => {
    setSelectionState(next);
    setItemsTouched(true);
    setRejectedIds((ids) => ids.filter((id) => id in next));
    setErrors((current) => ({ ...current, menu: undefined }));
  };

  const changeDate = (value: string) => {
    setDate(value);
    // La hora elegida puede no existir el nuevo día.
    if (value && schedules.length > 0 && time && !slotsForDate(schedules, value, now).includes(time)) setTime("");
    setErrors((current) => ({ ...current, when: undefined }));
  };

  const changeTime = (value: string) => {
    setTime(value);
    setErrors((current) => ({ ...current, when: undefined }));
  };

  function validate(target: BuilderStep): string | null {
    if (target === "when") {
      if (!date) return "Elige la fecha.";
      if (!time) return "Elige la hora.";
      if (unchangedTime) return null;
      const today = toDateKey(now);
      if (date < today || date > lastPlanDateKey(today)) return `Elige una fecha entre hoy y los próximos ${PLAN_LIMITS.maxDaysAhead} días.`;
      if (scheduledAt === null || scheduledAt < earliestPlanTime(now)) {
        return `El plan debe programarse con al menos ${PLAN_LIMITS.minLeadMinutes} minutos de anticipación.`;
      }
      if (schedules.length > 0 && !slotsForDate(schedules, date, now).includes(time)) return "El lugar está cerrado a esa hora.";
      return null;
    }
    if (target === "menu") {
      // Sin tocar los platos de un plan existente no se reenvían, así que no bloquean.
      if ((itemsTouched || !editing) && invalidIds.some((id) => id in selection)) return "Quita los platos que ya no están disponibles.";
      return null;
    }
    if (target === "details") {
      const size = Number(partySize);
      if (!Number.isInteger(size) || size < 1 || size > PLAN_LIMITS.maxPartySize) {
        return `Indica entre 1 y ${PLAN_LIMITS.maxPartySize} personas.`;
      }
      if (title.trim().length > PLAN_LIMITS.titleMax) return `El título admite hasta ${PLAN_LIMITS.titleMax} caracteres.`;
      if (notes.trim().length > PLAN_LIMITS.notesMax) return `Las notas admiten hasta ${PLAN_LIMITS.notesMax} caracteres.`;
      if (!reminderStillValid(reminder, scheduledAt, now)) return "Ese recordatorio quedaría en el pasado; elige uno más cercano o ninguno.";
      return null;
    }
    return null;
  }

  // Avanza si el paso actual es válido. Para ir hacia atrás no se valida.
  const goTo = (target: BuilderStep) => {
    const order = STEPS.map((item) => item.id);
    const from = order.indexOf(step);
    const to = order.indexOf(target);
    for (let index = from; index < to; index++) {
      const message = validate(order[index]);
      if (message) {
        setStep(order[index]);
        setErrors((current) => ({ ...current, [order[index]]: message }));
        return;
      }
    }
    setStep(target);
  };

  const next = () => {
    const order = STEPS.map((item) => item.id);
    const index = order.indexOf(step);
    if (index < order.length - 1) goTo(order[index + 1]);
  };

  const back = () => {
    const order = STEPS.map((item) => item.id);
    const index = order.indexOf(step);
    if (index > 0) setStep(order[index - 1]);
  };

  const submit = async () => {
    for (const item of STEPS) {
      const message = validate(item.id);
      if (message) {
        setStep(item.id);
        setErrors((current) => ({ ...current, [item.id]: message }));
        return;
      }
    }
    setIsSubmitting(true);
    setErrors({});
    const iso = toBogotaIso(date, time);
    try {
      if (editing) {
        const payload: PlanUpdatePayload = {
          party_size: Number(partySize),
          title: title.trim() || null,
          notes: notes.trim() || null,
          reminder_minutes_before: reminder,
        };
        if (!unchangedTime) payload.scheduled_at = iso;
        if (itemsTouched) payload.items = selectionPayload(selection);
        const plan = await updatePlan(editing.id, payload);
        const query = new URLSearchParams({ updated: "1" });
        if (!unchangedTime) query.set("rescheduled", "1");
        router.push(`/plans/${plan?.id ?? editing.id}?${query.toString()}`);
      } else {
        const plan = await createPlan({
          establishment_id: establishmentId,
          scheduled_at: iso,
          party_size: Number(partySize),
          title: title.trim() || null,
          notes: notes.trim() || null,
          reminder_minutes_before: reminder,
          items: selectionPayload(selection),
        });
        if (plan) router.push(`/plans/${plan.id}?created=1`);
      }
    } catch (error) {
      const target = planErrorStep(error);
      const rejected = invalidItemIds(error);
      if (rejected.length > 0) setRejectedIds(rejected);
      setErrors({ [target]: planErrorMessage(error, "No fue posible guardar el plan.") });
      setStep(target);
      setIsSubmitting(false);
    }
  };

  return {
    editing,
    detail,
    loadError,
    now,
    step,
    goTo,
    next,
    back,
    schedules,
    date,
    time,
    changeDate,
    changeTime,
    selection,
    setSelection,
    invalidIds,
    missingIds,
    lines,
    partySize,
    setPartySize,
    title,
    setTitle,
    notes,
    setNotes,
    reminder,
    setReminder,
    scheduledAt,
    whenLabel,
    errors,
    isSubmitting,
    submit,
  };
}
