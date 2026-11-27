"use client";

import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PlanCard from "@/components/plans/PlanCard";
import PlansCalendar from "@/components/plans/PlansCalendar";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listPlans, planErrorMessage, type PlanListItem } from "@/lib/plans-api";

const PAGE_SIZE = 10;
const PLAN_FILTERS = [
  { value: "SCHEDULED", label: "Próximos" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
] as const;

// Mis planes: calendario mensual y la lista de próximos (programados).
export default function PlansPage() {
  const [status, setStatus] = useState<PlanListItem["status"]>("SCHEDULED");
  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5eafb] pb-4 lg:rounded-2xl lg:bg-gradient-to-r lg:from-[#eef0ff] lg:to-[#f8f9ff] lg:p-6">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#514ddd]"><CalendarDays aria-hidden="true" className="size-4" /> Agenda de visitas</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mis planes</h1>
            <p className="text-sm text-[#43506a]">Agenda tus visitas, elige qué pedir y recibe un recordatorio.</p>
          </div>
          <Link
            href="/plans/new"
            className="flex h-11 items-center gap-2 rounded-xl bg-[#514ddd] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo plan
          </Link>
        </header>

        <div role="group" aria-label="Estado de los planes" className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          {PLAN_FILTERS.map(filter => (
            <button key={filter.value} type="button" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)} className="rounded-full px-3 py-2 text-xs font-bold text-[#43506a] hover:bg-[#eef0ff] aria-pressed:bg-[#514ddd] aria-pressed:text-white">
              {filter.label}
            </button>
          ))}
        </div>
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <PlansCalendar />
          <PlanList key={status} status={status} />
        </div>
      </div>
    </main>
  );
}

function PlanList({ status }: { status: PlanListItem["status"] }) {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (skip: number) => {
    setIsLoading(true);
    try {
      const page = await listPlans({ status, skip, limit: PAGE_SIZE });
      setPlans((current) => (skip === 0 ? (page?.items ?? []) : [...current, ...(page?.items ?? [])]));
      setTotal(page?.total ?? 0);
      setError("");
    } catch (loadError) {
      setError(planErrorMessage(loadError, "No fue posible cargar tus planes."));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  return (
    <section className="space-y-3">
      <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{status === "SCHEDULED" ? "Próximos planes" : status === "COMPLETED" ? "Planes completados" : "Planes cancelados"} {total !== undefined && <span className="rounded-full bg-[#e6eaff] px-2.5 py-1 text-xs text-[#514ddd]">{total}</span>}</h2>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {isLoading && plans.length === 0 ? (
        <div className="h-28 animate-pulse rounded-2xl bg-[#eef0ff]" aria-busy="true" />
      ) : plans.length === 0 && !error ? (
        <EmptyState
          icon={CalendarDays}
          title={status === "SCHEDULED" ? "No tienes planes próximos" : "No tienes planes en este estado"}
          description={status === "SCHEDULED" ? "Busca un lugar y usa “Planear visita” para agendarla." : undefined}
          action={
            <Link href="/explore" className="text-sm font-bold text-[#514ddd] hover:underline">
              Explorar lugares
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} featured />
          ))}
        </div>
      )}
      <LoadMoreButton loaded={plans.length} total={total} isLoading={isLoading} onLoadMore={() => void load(plans.length)} />
    </section>
  );
}
