"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { addDaysToKey, bogotaParts, formatDate, monthGrid, toBogotaIso, toDateKey } from "@/lib/datetime";
import { listPlans, planErrorMessage, type PlanListItem } from "@/lib/plans-api";
import PlanCard from "./PlanCard";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const DOT_CLASS: Record<PlanListItem["status"], string> = {
  SCHEDULED: "bg-[#514ddd]",
  COMPLETED: "bg-[#0b6b5c]",
  CANCELLED: "bg-[#b7bccb]",
};

// Calendario mensual (lunes primero, hora de Colombia) con puntos por día; al elegir un día muestra su
// agenda. Pide GET /plans?from&to con las 6 semanas visibles.
export default function PlansCalendar() {
  const today = toDateKey();
  const [{ year, month }, setMonth] = useState(() => {
    const parts = bogotaParts();
    return { year: parts.year, month: parts.month };
  });
  const [selected, setSelected] = useState(today);
  const [result, setResult] = useState<{ key: string; plans: PlanListItem[]; error: string } | null>(null);

  const grid = useMemo(() => monthGrid(year, month), [year, month]);
  const rangeKey = `${grid[0]}|${grid[grid.length - 1]}`;

  useEffect(() => {
    const controller = new AbortController();
    const from = toBogotaIso(grid[0]);
    const to = toBogotaIso(addDaysToKey(grid[grid.length - 1], 1));
    listPlans({ from, to, limit: 100 }, { signal: controller.signal })
      .then((page) => setResult({ key: rangeKey, plans: page?.items ?? [], error: "" }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key: rangeKey, plans: [], error: planErrorMessage(error, "No fue posible cargar el calendario.") });
      });
    return () => controller.abort();
  }, [grid, rangeKey]);

  const loading = result?.key !== rangeKey;
  const byDay = useMemo(() => {
    const map = new Map<string, PlanListItem[]>();
    if (loading || !result) return map;
    for (const plan of result.plans) {
      const key = toDateKey(plan.scheduled_at);
      map.set(key, [...(map.get(key) ?? []), plan]);
    }
    return map;
  }, [loading, result]);

  // Al cambiar de mes se elige hoy (si es ese mes) o el día 1.
  const shiftMonth = (delta: number) => {
    const index = year * 12 + (month - 1) + delta;
    const next = { year: Math.floor(index / 12), month: (index % 12) + 1 };
    const prefix = `${next.year}-${String(next.month).padStart(2, "0")}`;
    setMonth(next);
    setSelected(today.startsWith(prefix) ? today : `${prefix}-01`);
  };

  const agenda = byDay.get(selected) ?? [];
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-lg text-[#514ddd] hover:bg-[#f3f5ff]">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h2 className="flex items-center gap-2 text-lg font-extrabold capitalize text-[#17243d]" aria-live="polite">
            {MONTHS[month - 1]} {year}
            {loading && <Loader2 aria-label="Cargando" className="size-4 animate-spin text-[#81869a]" />}
          </h2>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente" className="flex size-9 items-center justify-center rounded-lg text-[#514ddd] hover:bg-[#f3f5ff]">
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#81869a]" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Días del mes">
          {grid.map((key) => {
            const plans = byDay.get(key) ?? [];
            const inMonth = key.startsWith(monthPrefix);
            const isSelected = key === selected;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${formatDate(`${key}T12:00:00-05:00`)}${plans.length ? `, ${plans.length} ${plans.length === 1 ? "plan" : "planes"}` : ""}`}
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition sm:aspect-auto sm:h-14 ${
                  isSelected
                    ? "bg-[#514ddd] font-bold text-white"
                    : isToday
                      ? "bg-[#eef0ff] font-bold text-[#514ddd]"
                      : inMonth
                        ? "text-[#17243d] hover:bg-[#f3f5ff]"
                        : "text-[#b7bccb] hover:bg-[#f3f5ff]"
                }`}
              >
                {Number(key.slice(8))}
                <span className="flex h-1.5 gap-0.5">
                  {plans.slice(0, 3).map((plan) => (
                    <span key={plan.id} className={`size-1.5 rounded-full ${isSelected ? "bg-white" : DOT_CLASS[plan.status]}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        {result?.error && !loading && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{result.error}</p>}
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-bold first-letter:uppercase text-[#17243d]">
          {formatDate(`${selected}T12:00:00-05:00`, { weekday: "long" })}
        </h3>
        {loading ? null : agenda.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin planes este día" className="py-6" />
        ) : (
          <div className="space-y-3">
            {agenda.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
