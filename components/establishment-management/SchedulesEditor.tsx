"use client";

import { CopyCheck, Loader2, Moon, Plus, RotateCcw, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EstablishmentSchedule } from "@/lib/establishments-api";
import type { ScheduleInput } from "@/lib/restaurant-api";
import {
  crossesMidnight,
  DAY_NAMES,
  DEFAULT_SEGMENT,
  MAX_SEGMENTS_PER_DAY,
  sameWeek,
  validateWeek,
  weekFromSchedules,
  weekToPayload,
  type Segment,
  type WeekSchedule,
} from "./schedules";

type SchedulesEditorProps = {
  // El panel del restaurante usa /restaurant/schedules; el admin (F5) usará /admin/establishments/{id}/schedules.
  load: () => Promise<EstablishmentSchedule[] | undefined>;
  save: (schedules: ScheduleInput[]) => Promise<EstablishmentSchedule[] | undefined>;
};

const timeInput =
  "h-10 w-[7.5rem] rounded-xl border border-[#d7dcf2] bg-white px-3 text-sm font-semibold text-[#17243d] outline-none focus:border-[#514ddd] focus:ring-2 focus:ring-[#514ddd]/20";

// Editor semanal de horarios (sección 7.5 del plan): siete días con interruptor Abierto/Cerrado, hasta 3 tramos
// por día, "Copiar a todos los días", aviso de cierre al día siguiente y validación de solapes antes del PUT.
export default function SchedulesEditor({ load, save }: SchedulesEditorProps) {
  const [saved, setSaved] = useState<WeekSchedule | null>(null);
  const [week, setWeek] = useState<WeekSchedule | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const fetchWeek = useCallback(async () => {
    try {
      const data = weekFromSchedules((await load()) ?? []);
      setSaved(data);
      setWeek(data);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No fue posible cargar los horarios.");
    }
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(fetchWeek);
  }, [fetchWeek]);

  const errors = useMemo(() => (week ? validateWeek(week) : {}), [week]);
  const dirty = Boolean(week && saved && !sameWeek(week, saved));
  const hasErrors = Object.keys(errors).length > 0;

  // Avisa antes de salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> modificación de una fila: reemplaza los tramos del día `day` sin tocar las demás.
  const update = (day: number, change: (segments: Segment[]) => Segment[]) => {
    setMessage("");
    setSubmitError("");
    setWeek((current) => current && current.map((segments, index) => (index === day ? change(segments) : segments)));
  };

  // GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> copia la fila de un día en todas las filas de la matriz.
  const copyToAll = (day: number) => {
    setMessage("");
    setSubmitError("");
    setWeek((current) => current && current.map(() => current[day].map((segment) => ({ ...segment }))));
  };

  const submit = async () => {
    if (!week) return;
    setShowErrors(true);
    if (hasErrors) {
      setSubmitError("Revisa los días marcados antes de guardar.");
      return;
    }
    setSaving(true);
    setSubmitError("");
    setMessage("");
    try {
      const data = weekFromSchedules((await save(weekToPayload(week))) ?? []);
      setSaved(data);
      setWeek(data);
      setShowErrors(false);
      setMessage("Horarios guardados. Ya se ven en tu ficha pública.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No fue posible guardar los horarios.");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-3 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
        <p>{loadError}</p>
        <button type="button" onClick={() => void fetchWeek()} className="font-semibold underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (!week) {
    return (
      <div aria-busy="true" className="space-y-3">
        {DAY_NAMES.map((day) => (
          <div key={day} className="h-16 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  // GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> operación: días abiertos = filas con al menos un tramo.
  const openDays = week.filter((segments) => segments.length > 0).length;

  return (
    <div className="space-y-4">
      {openDays === 0 && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Tu local no tiene horarios. Sin ellos, tus clientes no sabrán cuándo visitarte ni podrán planear visitas con
          validación de apertura.
        </p>
      )}

      {/* GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> recorrido: una tarjeta por fila (día) y un par de campos por columna (tramo). */}
      <ul className="space-y-3">
        {week.map((segments, day) => {
          const open = segments.length > 0;
          const error = showErrors || dirty ? errors[day] : undefined;
          const switchId = `day-${day}-open`;
          return (
            <li
              key={DAY_NAMES[day]}
              className={`rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.06)] sm:p-5 ${error ? "ring-2 ring-red-300" : ""}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex items-center justify-between gap-3 lg:w-48 lg:shrink-0 lg:pt-2">
                  <p className="text-base font-bold">{DAY_NAMES[day]}</p>
                  <label htmlFor={switchId} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#43506a]">
                    <input
                      id={switchId}
                      type="checkbox"
                      role="switch"
                      checked={open}
                      onChange={(event) => update(day, () => (event.target.checked ? [{ ...DEFAULT_SEGMENT }] : []))}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="relative h-6 w-11 rounded-full bg-[#d7dcf2] transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-[#0b6b5c] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#514ddd]"
                    />
                    <span className="w-16">{open ? "Abierto" : "Cerrado"}</span>
                  </label>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  {!open && <p className="pt-2 text-sm text-[#9295a4]">Cerrado todo el día</p>}
                  {/* GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> acceso [fila][columna]: week[day][index] es el tramo que se lee o se modifica. */}
                  {segments.map((segment, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`day-${day}-${index}-open`}>
                        {`${DAY_NAMES[day]}, tramo ${index + 1}: apertura`}
                      </label>
                      <input
                        id={`day-${day}-${index}-open`}
                        type="time"
                        step={60}
                        required
                        value={segment.opening_time}
                        onChange={(event) =>
                          update(day, (current) =>
                            current.map((item, i) => (i === index ? { ...item, opening_time: event.target.value } : item)),
                          )
                        }
                        className={timeInput}
                      />
                      <span aria-hidden="true" className="text-sm text-[#6d6e7a]">
                        a
                      </span>
                      <label className="sr-only" htmlFor={`day-${day}-${index}-close`}>
                        {`${DAY_NAMES[day]}, tramo ${index + 1}: cierre`}
                      </label>
                      <input
                        id={`day-${day}-${index}-close`}
                        type="time"
                        step={60}
                        required
                        value={segment.closing_time}
                        onChange={(event) =>
                          update(day, (current) =>
                            current.map((item, i) => (i === index ? { ...item, closing_time: event.target.value } : item)),
                          )
                        }
                        className={timeInput}
                      />
                      {crossesMidnight(segment) && (
                        <span className="flex items-center gap-1 rounded-full bg-[#eef0ff] px-2.5 py-1 text-xs font-semibold text-[#514ddd]">
                          <Moon aria-hidden="true" className="size-3.5" />
                          Cierra al día siguiente
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => update(day, (current) => current.filter((_, i) => i !== index))}
                        aria-label={`Quitar el tramo ${index + 1} del ${DAY_NAMES[day].toLowerCase()}`}
                        className="flex size-9 items-center justify-center rounded-lg text-[#6d6e7a] hover:bg-red-50 hover:text-red-600"
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ))}
                  {error && (
                    <p role="alert" className="text-sm font-semibold text-red-600">
                      {error}
                    </p>
                  )}
                </div>

                {open && (
                  <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-col lg:items-end">
                    {segments.length < MAX_SEGMENTS_PER_DAY && (
                      <button
                        type="button"
                        onClick={() => update(day, (current) => [...current, nextSegment(current)])}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#514ddd] hover:bg-[#f3f5ff]"
                      >
                        <Plus aria-hidden="true" className="size-3.5" />
                        Añadir tramo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToAll(day)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#43506a] hover:bg-[#f3f5fb]"
                    >
                      <CopyCheck aria-hidden="true" className="size-3.5" />
                      Copiar a todos los días
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_8px_24px_rgba(23,36,61,0.12)] backdrop-blur md:bottom-4">
        <p className="text-sm" role="status">
          {submitError ? (
            <span className="font-semibold text-red-600">{submitError}</span>
          ) : message ? (
            <span className="font-semibold text-[#0b6b5c]">{message}</span>
          ) : dirty ? (
            <span className="text-[#43506a]">Tienes cambios sin guardar.</span>
          ) : (
            <span className="text-[#6d6e7a]">
              {openDays === 0 ? "Sin horarios publicados." : `Abierto ${openDays} ${openDays === 1 ? "día" : "días"} a la semana.`}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setWeek(saved);
              setShowErrors(false);
              setSubmitError("");
              setMessage("");
            }}
            disabled={!dirty || saving}
            className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5fb] disabled:opacity-50"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Descartar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!dirty || saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#514ddd] px-5 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-50"
          >
            {saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
            Guardar horarios
          </button>
        </div>
      </div>
    </div>
  );
}

// Propone un tramo nuevo después del último (p. ej. tras 08:00–15:00, 18:00–22:00).
function nextSegment(segments: Segment[]): Segment {
  const last = segments.at(-1);
  if (!last) return { ...DEFAULT_SEGMENT };
  const [hours] = last.closing_time.split(":").map(Number);
  const start = Math.min(hours + 3, 22);
  return { opening_time: `${String(start).padStart(2, "0")}:00`, closing_time: "23:00" };
}
