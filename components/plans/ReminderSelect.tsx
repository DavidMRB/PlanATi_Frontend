"use client";

import { REMINDER_LABEL, REMINDER_OPTIONS, type ReminderMinutes } from "@/lib/plans-api";

type ReminderSelectProps = {
  value: ReminderMinutes | null;
  onChange: (value: ReminderMinutes | null) => void;
  // Hora del plan (ms). Sin ella no se deshabilita nada.
  scheduledAt: number | null;
  now: number;
  id?: string;
};

// Recordatorio del plan. Se deshabilitan las opciones que quedarían en el pasado (el backend las rechaza
// con REMINDER_IN_PAST).
export default function ReminderSelect({ value, onChange, scheduledAt, now, id }: ReminderSelectProps) {
  const inPast = (minutes: number) => scheduledAt !== null && scheduledAt - minutes * 60_000 <= now;

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value ? (Number(event.target.value) as ReminderMinutes) : null)}
      className="h-11 w-full rounded-xl border border-[#d7dcf2] bg-white px-3 text-sm text-[#17243d] outline-none focus:ring-2 focus:ring-[#6868e8]/40"
    >
      <option value="">Sin recordatorio</option>
      {REMINDER_OPTIONS.map((minutes) => (
        <option key={minutes} value={minutes} disabled={inPast(minutes)}>
          {REMINDER_LABEL[minutes]}
          {inPast(minutes) ? " (ya no es posible)" : ""}
        </option>
      ))}
    </select>
  );
}

export function reminderStillValid(minutes: ReminderMinutes | null, scheduledAt: number | null, now = Date.now()) {
  return minutes === null || scheduledAt === null || scheduledAt - minutes * 60_000 > now;
}
