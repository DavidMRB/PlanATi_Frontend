"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import PlanStatusBadge from "@/components/plans/PlanStatusBadge";
import PlanBuilder from "@/components/plans/PlanBuilder.tsx";
import { getPlan, isPlanEditable, planErrorMessage, type PlanDetail } from "@/lib/plans-api";

// Asistente en modo edición. Solo planes programados y futuros con el local disponible.
export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const planId = Number(id);
  const isValidId = Number.isInteger(planId) && planId > 0;
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [error, setError] = useState(() => (isValidId ? "" : "Este plan no existe."));

  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;
    getPlan(planId)
      .then((data) => {
        if (cancelled || !data) return;
        if (!isPlanEditable(data)) setError("Este plan ya no se puede editar: solo se editan planes programados que aún no han pasado.");
        else if (!data.establishment_available) setError("El establecimiento ya no está disponible; puedes cancelar o eliminar el plan.");
        else setPlan(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(planErrorMessage(loadError, "No fue posible cargar el plan."));
      });
    return () => {
      cancelled = true;
    };
  }, [isValidId, planId]);

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href={isValidId ? `/plans/${planId}` : "/plans"} className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd]">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al plan
        </Link>
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#e7eafa] bg-white p-4 sm:p-6">
          <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Editar plan</h1>
          <p className="text-sm text-[#43506a]">Modifica los detalles, productos y recordatorio de tu visita.</p>
          </div>
          {plan && <PlanStatusBadge status={plan.status} />}
        </header>
        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : plan ? (
          <PlanBuilder plan={plan} />
        ) : (
          <div className="h-64 animate-pulse rounded-3xl bg-[#eef0ff]" aria-busy="true" />
        )}
      </div>
    </main>
  );
}
