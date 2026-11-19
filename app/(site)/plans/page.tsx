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

// Mis planes: calendario mensual y la lista de próximos (programados).
export default function PlansPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <PlansCalendar />
          <UpcomingPlans />
        </div>
      </div>
    </main>
  );
}

function UpcomingPlans() {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (skip: number) => {
    setIsLoading(true);
    try {
      const page = await listPlans({ status: "SCHEDULED", skip, limit: PAGE_SIZE });
      setPlans((current) => (skip === 0 ? (page?.items ?? []) : [...current, ...(page?.items ?? [])]));
      setTotal(page?.total ?? 0);
      setError("");
    } catch (loadError) {
      setError(planErrorMessage(loadError, "No fue posible cargar tus planes."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-extrabold">Próximos</h2>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {isLoading && plans.length === 0 ? (
        <div className="h-28 animate-pulse rounded-2xl bg-[#eef0ff]" aria-busy="true" />
      ) : plans.length === 0 && !error ? (
        <EmptyState
          icon={CalendarDays}
          title="No tienes planes próximos"
          description="Busca un lugar y usa “Planear visita” para agendarla."
          action={
            <Link href="/explore" className="text-sm font-bold text-[#514ddd] hover:underline">
              Explorar lugares
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
      <LoadMoreButton loaded={plans.length} total={total} isLoading={isLoading} onLoadMore={() => void load(plans.length)} />
    </section>
  );
}
