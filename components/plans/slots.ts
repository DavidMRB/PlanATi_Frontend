import { addDaysToKey, toBogotaIso, weekdayOfKey } from "@/lib/datetime";
import type { EstablishmentSchedule } from "@/lib/establishments-api";
import { PLAN_LIMITS } from "@/lib/plans-api";
import { toMinutes } from "@/components/establishment-management/schedules";

// Franjas del asistente de planes a partir de los horarios del local (hora de Colombia). Mismas reglas que
// `is_open_at` del backend: la apertura se incluye y el cierre se excluye; un tramo que cruza la medianoche
// (sábado 18:00–02:00) cubre también la madrugada del día siguiente.

export const SLOT_STEP_MINUTES = 30;

type ScheduleLike = Pick<EstablishmentSchedule, "day_of_week" | "opening_time" | "closing_time">;

const pad = (value: number) => String(value).padStart(2, "0");
const minutesToTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const hhmm = (value: string) => toMinutes(value.slice(0, 5));

// GUIA #10 TEMA: Subalgoritmos (funciones, procedimientos y modularización) -> función booleana (equivale a is_open_at del backend).
// GUIA #6 TEMA: Ciclos -> `for...of` recorre los tramos; `continue` salta los incompletos y `return` corta al encontrar uno abierto.
export function isOpenAt(schedules: ScheduleLike[], weekday: number, minute: number): boolean {
  const yesterday = (weekday + 6) % 7;
  for (const schedule of schedules) {
    const start = hhmm(schedule.opening_time);
    const end = hhmm(schedule.closing_time);
    if (start === null || end === null) continue;
    if (start < end && schedule.day_of_week === weekday && start <= minute && minute < end) return true;
    if (start > end) {
      if (schedule.day_of_week === weekday && minute >= start) return true;
      if (schedule.day_of_week === yesterday && minute < end) return true;
    }
  }
  return false;
}

// Primer instante en que se puede planear (ahora + la anticipación mínima del backend).
export function earliestPlanTime(now = Date.now()): number {
  return now + PLAN_LIMITS.minLeadMinutes * 60_000;
}

export function lastPlanDateKey(todayKey: string): string {
  return addDaysToKey(todayKey, PLAN_LIMITS.maxDaysAhead - 1);
}

export function slotTimestamp(dateKey: string, time: string): number {
  return new Date(toBogotaIso(dateKey, time)).getTime();
}

// GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> integración: franjas cada 30 min del asistente de planes según la fila del día.
// GUIA #6 TEMA: Ciclos -> `for` con paso de 30 minutos genera las horas candidatas.
// GUIA #8 TEMA: Vectores (ordenamiento y búsqueda) -> `sort((a, b) => a - b)` ordena ascendente y `filter` busca las que cumplen la condición.
// Horas "HH:MM" en que el local abre ese día (cada 30 min, más las horas de apertura que no caen en
// :00/:30), sin las que ya pasaron o no cumplen la anticipación mínima.
export function slotsForDate(schedules: ScheduleLike[], dateKey: string, now = Date.now()): string[] {
  const weekday = weekdayOfKey(dateKey);
  const candidates = new Set<number>();
  for (let minute = 0; minute < 24 * 60; minute += SLOT_STEP_MINUTES) candidates.add(minute);
  for (const schedule of schedules) {
    const start = hhmm(schedule.opening_time);
    if (start !== null && schedule.day_of_week === weekday) candidates.add(start);
  }
  const earliest = earliestPlanTime(now);
  return [...candidates]
    .sort((a, b) => a - b)
    .filter((minute) => isOpenAt(schedules, weekday, minute))
    .map(minutesToTime)
    .filter((time) => slotTimestamp(dateKey, time) >= earliest);
}

// ¿El local abre en algún momento de ese día de la semana (incluida la madrugada de un tramo de ayer)?
export function isClosedAllDay(schedules: ScheduleLike[], weekday: number): boolean {
  if (schedules.length === 0) return false;
  for (let minute = 0; minute < 24 * 60; minute += 1) {
    if (isOpenAt(schedules, weekday, minute)) return false;
  }
  return true;
}
