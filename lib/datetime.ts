// Fechas y horas de la app. Zona horaria fija de Colombia: America/Bogota (UTC−5, sin horario de verano).
// La API responde en UTC con offset; aquí se convierte a la hora local para mostrarla y se construyen
// las fechas que se envían (ISO con offset -05:00).

export const APP_TIME_ZONE = "America/Bogota";
const BOGOTA_OFFSET = "-05:00";
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let instance = formatters.get(key);
  if (!instance) {
    instance = new Intl.DateTimeFormat("es-CO", { timeZone: APP_TIME_ZONE, ...options });
    formatters.set(key, instance);
  }
  return instance;
}

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

// "20 de noviembre de 2026"
export function formatDate(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return formatter({ day: "numeric", month: "long", year: "numeric", ...options }).format(toDate(value));
}

// "7:30 p. m."
export function formatTime(value: string | number | Date): string {
  return formatter({ hour: "numeric", minute: "2-digit", hour12: true }).format(toDate(value));
}

// "jueves, 20 de noviembre de 2026, 7:30 p. m."
export function formatDateTime(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return formatter({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(toDate(value));
}

// Partes de la fecha en hora de Colombia (mes 1–12; día de la semana 0 = lunes … 6 = domingo).
export function bogotaParts(value: string | number | Date = new Date()) {
  // Colombia no tiene horario de verano: basta con desplazar 5 horas y leer en UTC.
  const shifted = new Date(toDate(value).getTime() + BOGOTA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: (shifted.getUTCDay() + 6) % 7,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

// "2026-11-20" (la fecha local de Colombia, para <input type="date"> y para agrupar por día).
export function toDateKey(value: string | number | Date = new Date()): string {
  const { year, month, day } = bogotaParts(value);
  return `${year}-${pad(month)}-${pad(day)}`;
}

// ("2026-11-20", "19:30") → "2026-11-20T19:30:00-05:00"
export function toBogotaIso(date: string, time = "00:00"): string {
  const [hours = "00", minutes = "00"] = time.split(":");
  return `${date}T${pad(Number(hours))}:${pad(Number(minutes))}:00${BOGOTA_OFFSET}`;
}

// Rango del mes en hora local, como ISO con offset, para filtrar planes (`from` inclusivo, `to` exclusivo).
export function monthRange(year: number, month: number): { from: string; to: string } {
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return {
    from: toBogotaIso(`${year}-${pad(month)}-01`),
    to: toBogotaIso(`${next.year}-${pad(next.month)}-01`),
  };
}

// Cuadrícula del calendario mensual (lunes primero): 6 semanas × 7 días como claves "YYYY-MM-DD".
export function monthGrid(year: number, month: number): string[] {
  const firstUtc = Date.UTC(year, month - 1, 1);
  const leading = (new Date(firstUtc).getUTCDay() + 6) % 7;
  const start = firstUtc - leading * DAY_MS;
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start + index * DAY_MS);
    return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
  });
}

// "Ahora", "Hace 5 min", "Hace 3 h", "Hace 2 días", "Hace 3 semanas", "Hace 4 meses" o "noviembre de 2025".
export function timeAgo(value: string | number | Date, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - toDate(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  return formatDate(value, { day: undefined });
}

// Fecha UTC en el formato de Google Calendar: 20261121T003000Z.
export function toCalendarUtc(value: string | number | Date): string {
  return toDate(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type CalendarEventInput = {
  title: string;
  start: string | Date;
  // Por defecto, 2 horas después del inicio.
  end?: string | Date;
  details?: string;
  location?: string;
};

// Enlace "Agregar a Google Calendar". No incluye la alarma; el archivo .ics del backend sí.
export function googleCalendarUrl({ title, start, end, details, location }: CalendarEventInput): string {
  const startDate = toDate(start);
  const endDate = end ? toDate(end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(title)}`,
    `dates=${toCalendarUtc(startDate)}/${toCalendarUtc(endDate)}`,
    `ctz=${encodeURIComponent(APP_TIME_ZONE)}`,
  ];
  if (details) params.push(`details=${encodeURIComponent(details)}`);
  if (location) params.push(`location=${encodeURIComponent(location)}`);
  return `https://calendar.google.com/calendar/render?${params.join("&")}`;
}

// "2026-11-20" + 3 → "2026-11-23" (aritmética de calendario sobre claves de fecha).
export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

// Día de la semana de una clave de fecha (0 = lunes … 6 = domingo, como `day_of_week` del backend).
export function weekdayOfKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

// "19:30" de una fecha ISO, en hora de Colombia.
export function toTimeKey(value: string | number | Date): string {
  const { hour, minute } = bogotaParts(value);
  return `${pad(hour)}:${pad(minute)}`;
}
