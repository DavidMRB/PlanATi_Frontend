"use client";

import { AlertTriangle, Moon } from "lucide-react";
import { useMemo } from "react";
import { DAY_NAMES } from "@/components/establishment-management/schedules";
import { addDaysToKey, toDateKey, weekdayOfKey } from "@/lib/datetime";
import type { EstablishmentSchedule } from "@/lib/establishments-api";
import { isClosedAllDay, lastPlanDateKey, slotsForDate } from "./slots";

type TimeSlotPickerProps = {
  schedules: EstablishmentSchedule[];
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  now: number;
  error?: string;
  showDateStrip?: boolean;
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#d7dcf2] bg-white px-3 text-sm text-[#17243d] outline-none focus:ring-2 focus:ring-[#6868e8]/40";

// Fecha + franjas de 30 min según los horarios del local (hora de Colombia, con tramos que cruzan la
// medianoche). Si el local no publicó horarios, la hora es libre (el backend no la restringe).
export default function TimeSlotPicker({ schedules, date, time, onDateChange, onTimeChange, now, error, showDateStrip = false }: TimeSlotPickerProps) {
  const today = toDateKey(now);
  const lastDate = lastPlanDateKey(today);
  const hasSchedules = schedules.length > 0;
  const slots = useMemo(() => (date && hasSchedules ? slotsForDate(schedules, date, now) : []), [date, hasSchedules, schedules, now]);
  const closedDays = useMemo(
    () => DAY_NAMES.map((_, weekday) => isClosedAllDay(schedules, weekday)),
    [schedules],
  );
  const weekday = date ? weekdayOfKey(date) : null;
  const closedThatDay = weekday !== null && closedDays[weekday];
  const openDayNames = DAY_NAMES.filter((_, index) => !closedDays[index]);
  const stripStart = date && addDaysToKey(date, -2) > today ? addDaysToKey(date, -2) : today;
  const quickDates = Array.from({ length: 5 }, (_, index) => addDaysToKey(stripStart, index)).filter((day) => day <= lastDate);

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-[#26344d]">Fecha</span>
        <input
          type="date"
          value={date}
          min={today}
          max={lastDate}
          onChange={(event) => onDateChange(event.target.value)}
          className={inputClass}
        />
      </label>
      {showDateStrip && (
        <div role="group" aria-label="Fechas cercanas" className="grid grid-cols-5 gap-1.5">
          {quickDates.map((key) => (
            <button key={key} type="button" aria-pressed={date === key} aria-label={key} onClick={() => onDateChange(key)} className={`grid min-h-14 place-content-center rounded-xl px-1 py-1.5 text-center ${date === key ? "bg-[#514ddd] text-white" : "bg-[#eef0ff] text-[#43506a] hover:bg-[#e2e5ff]"}`}>
              <span className="text-[10px] font-semibold uppercase">{DAY_NAMES[weekdayOfKey(key)].slice(0, 3)}</span>
              <span className="text-lg leading-tight font-extrabold">{key.slice(-2)}</span>
            </button>
          ))}
        </div>
      )}
      {hasSchedules && openDayNames.length < 7 && (
        <p className="text-xs text-[#6d6e7a]">Abre: {openDayNames.join(", ").toLowerCase()}.</p>
      )}

      {!hasSchedules ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Este lugar no publicó sus horarios: elige la hora libremente y confirma con el establecimiento que esté abierto.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#26344d]">Hora</span>
            <input type="time" value={time} step={300} onChange={(event) => onTimeChange(event.target.value)} className={inputClass} />
          </label>
        </div>
      ) : !date ? (
        <p className="text-sm text-[#6d6e7a]">Elige una fecha para ver las horas disponibles.</p>
      ) : closedThatDay ? (
        <p className="rounded-xl bg-[#fde0e3] px-4 py-3 text-sm font-semibold text-[#a30f35]">
          El lugar está cerrado los {DAY_NAMES[weekday ?? 0].toLowerCase()}. Elige otra fecha.
        </p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl bg-[#fde0e3] px-4 py-3 text-sm font-semibold text-[#a30f35]">
          {date === today ? "Ya no quedan horas disponibles hoy." : "No hay horas disponibles ese día."} Elige otra fecha.
        </p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#26344d]">Hora</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((slot) => {
              const selected = slot === time;
              const lateNight = Number(slot.slice(0, 2)) < 6;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onTimeChange(slot)}
                  className={`flex h-10 items-center justify-center gap-1 rounded-xl text-sm font-semibold transition ${
                    selected ? "bg-[#514ddd] text-white shadow-md" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
                  }`}
                >
                  {lateNight && <Moon aria-label="madrugada" className="size-3.5" />}
                  {slot}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
