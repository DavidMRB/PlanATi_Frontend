// Reglas de horarios (las mismas que app/services/schedule_service.py del backend): hora local de Colombia,
// day_of_week 0 = lunes … 6 = domingo, hasta 3 tramos por día, apertura ≠ cierre, un cierre menor que la
// apertura cruza la medianoche y ningún tramo se solapa con otro en toda la semana (incluido domingo → lunes).

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export const MAX_SEGMENTS_PER_DAY = 3;
export const DEFAULT_SEGMENT: Segment = { opening_time: "08:00", closing_time: "17:00" };

export type Segment = { opening_time: string; closing_time: string };
// GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> WeekSchedule es una matriz (lista de listas): fila = día (0 = lunes ... 6 = domingo)
// y columna = tramo. Es irregular: cada día tiene de 0 a 3 tramos. Acceso: week[dia][tramo].
// Siete días; un día sin tramos está cerrado.
export type WeekSchedule = Segment[][];

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// "HH:MM:SS" (como llega del backend) → "HH:MM".
export function toHHMM(value: string): string {
  return value.slice(0, 5);
}

export function toMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function crossesMidnight(segment: Segment): boolean {
  const open = toMinutes(segment.opening_time);
  const close = toMinutes(segment.closing_time);
  return open !== null && close !== null && close < open;
}

// GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> creación: 7 filas vacías (semana sin horario; reemplaza a la matriz nula).
export function emptyWeek(): WeekSchedule {
  return DAY_NAMES.map(() => []);
}

// GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> llenado: cada horario de la API se agrega a la fila de su día (`week[dia].push`).
// GUIA #8 TEMA: Vectores (ordenamiento y búsqueda) -> cada fila se ordena por hora de apertura (ascendente).
export function weekFromSchedules(schedules: Array<{ day_of_week: number } & Segment>): WeekSchedule {
  const week = emptyWeek();
  for (const item of schedules) {
    if (item.day_of_week < 0 || item.day_of_week > 6) continue;
    week[item.day_of_week].push({ opening_time: toHHMM(item.opening_time), closing_time: toHHMM(item.closing_time) });
  }
  for (const day of week) day.sort((a, b) => a.opening_time.localeCompare(b.opening_time));
  return week;
}

// Matriz -> lista plana que espera el backend (PUT /restaurant/schedules).
export function weekToPayload(week: WeekSchedule) {
  return week.flatMap((segments, day) =>
    segments.map((segment) => ({ day_of_week: day, opening_time: segment.opening_time, closing_time: segment.closing_time })),
  );
}

export function sameWeek(a: WeekSchedule, b: WeekSchedule): boolean {
  return JSON.stringify(weekToPayload(a)) === JSON.stringify(weekToPayload(b));
}

function label(day: number, segment: Segment): string {
  return `${DAY_NAMES[day].toLowerCase()} ${segment.opening_time}–${segment.closing_time}`;
}

// GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> recorrido anidado: filas (días) y columnas (tramos) para validar cada celda;
// después, dos ciclos `for` anidados comparan cada par de tramos para detectar solapamientos.
// GUIA #10 TEMA: Subalgoritmos (funciones, procedimientos y modularización) -> función que devuelve un diccionario {día: mensaje de error}.
// Errores por día (índice → mensaje). Vacío si la semana es válida.
export function validateWeek(week: WeekSchedule): Record<number, string> {
  const errors: Record<number, string> = {};
  const intervals: Array<{ day: number; segment: Segment; start: number; end: number }> = [];

  // GUIA #6 TEMA: Ciclos -> `forEach` recorre las filas y `for...of` los tramos; `return` corta la fila con error.
  week.forEach((segments, day) => {
    if (segments.length > MAX_SEGMENTS_PER_DAY) {
      errors[day] = `Máximo ${MAX_SEGMENTS_PER_DAY} tramos por día.`;
      return;
    }
    for (const segment of segments) {
      const open = toMinutes(segment.opening_time);
      const close = toMinutes(segment.closing_time);
      if (open === null || close === null) {
        errors[day] = "Completa las horas de apertura y cierre.";
        return;
      }
      if (open === close) {
        errors[day] = "La apertura y el cierre no pueden ser la misma hora.";
        return;
      }
      const start = day * MINUTES_PER_DAY + open;
      const end = day * MINUTES_PER_DAY + close + (close < open ? MINUTES_PER_DAY : 0);
      intervals.push({ day, segment, start, end });
    }
  });

  // GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> ciclos anidados i / j sobre todos los tramos de la semana.
  // Intervalos semiabiertos [inicio, fin): un tramo que cierra a las 15:00 no choca con otro que abre a las 15:00.
  // El domingo nocturno puede invadir el lunes, por eso se compara también desplazando una semana.
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];
      const overlaps = [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].some(
        (shift) => a.start < b.end + shift && b.start + shift < a.end,
      );
      if (overlaps) {
        const day = errors[b.day] ? a.day : b.day;
        errors[day] ??= `Se solapan ${label(a.day, a.segment)} y ${label(b.day, b.segment)}.`;
      }
    }
  }

  return errors;
}
