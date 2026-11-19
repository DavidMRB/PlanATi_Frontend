"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  MessageSquarePlus,
  Navigation,
  Pencil,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState, type ReactNode } from "react";
import { StaticLocationMap } from "@/components/map/lazy";
import AddToCalendarMenu from "@/components/plans/AddToCalendarMenu";
import PlanStatusBadge from "@/components/plans/PlanStatusBadge";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/datetime";
import { formatCop } from "@/lib/format";
import { directionsUrl, mapsSearchUrl, toLatLng } from "@/lib/geo";
import {
  cancelPlan,
  deletePlan,
  getPlan,
  isPlanEditable,
  planErrorMessage,
  REMINDER_LABEL,
  type PlanDetail,
} from "@/lib/plans-api";

const card = "rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6";

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const planId = Number(id);
  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/plans" className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd]">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Mis planes
        </Link>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-[#eef0ff]" />}>
          {Number.isInteger(planId) && planId > 0 ? (
            <PlanView planId={planId} />
          ) : (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">Este plan no existe.</p>
          )}
        </Suspense>
      </div>
    </main>
  );
}

function PlanView({ planId }: { planId: number }) {
  const router = useRouter();
  const search = useSearchParams();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [actionError, setActionError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    getPlan(planId)
      .then((data) => {
        if (!cancelled) setPlan(data ?? null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(planErrorMessage(loadError, "No fue posible cargar el plan."));
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>;
  if (!plan) return <div className="h-64 animate-pulse rounded-3xl bg-[#eef0ff]" aria-busy="true" />;

  const created = search.get("created") === "1";
  const updated = search.get("updated") === "1";
  const rescheduled = search.get("rescheduled") === "1";
  const editable = isPlanEditable(plan, now);
  const point = toLatLng(plan.establishment.latitude, plan.establishment.longitude);
  const routeUrl = point
    ? directionsUrl(point.lat, point.lng)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.establishment.address)}`;
  const total = Number(plan.total_amount);

  const runAction = async () => {
    if (!confirm) return;
    setIsWorking(true);
    setActionError("");
    try {
      if (confirm === "delete") {
        await deletePlan(plan.id);
        router.push("/plans");
        return;
      }
      const result = await cancelPlan(plan.id);
      if (result) setPlan(result);
      setConfirm(null);
    } catch (actionFailure) {
      setActionError(planErrorMessage(actionFailure, "No fue posible completar la acción."));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      {created && (
        <Banner tone="success" icon={CheckCircle2}>
          <p className="font-bold">¡Plan creado!</p>
          <p>
            {plan.reminder_minutes_before
              ? `Te recordaremos ${REMINDER_LABEL[plan.reminder_minutes_before]}.`
              : "No elegiste recordatorio."}{" "}
            ¿Quieres agregarlo a tu calendario?
          </p>
          <div className="pt-2">
            <AddToCalendarMenu plan={plan} />
          </div>
        </Banner>
      )}
      {updated && !created && (
        <Banner tone="success" icon={CheckCircle2}>
          <p className="font-bold">Cambios guardados.</p>
          {rescheduled && <p>Si ya lo tenías en tu calendario, vuelve a agregarlo para actualizar la fecha.</p>}
        </Banner>
      )}
      {!plan.establishment_available && (
        <Banner tone="warning" icon={AlertTriangle}>
          El establecimiento ya no está disponible en PlanATi. Puedes cancelar o eliminar el plan.
        </Banner>
      )}
      {plan.status === "SCHEDULED" && plan.outside_schedule && (
        <Banner tone="warning" icon={AlertTriangle}>
          Con sus horarios actuales, el lugar ya no abre a la hora de este plan. Te recomendamos cambiar la hora.
        </Banner>
      )}
      {plan.prices_changed && (
        <Banner tone="warning" icon={AlertTriangle}>
          Algunos precios cambiaron o ya no están disponibles desde que creaste el plan.
          {editable ? " Edita el menú para actualizar el total." : ""}
        </Banner>
      )}

      <section className={`${card} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <PlanStatusBadge status={plan.status} />
            <h1 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${plan.status === "CANCELLED" ? "text-[#81869a] line-through" : ""}`}>
              {plan.title}
            </h1>
          </div>
          {plan.status !== "CANCELLED" && <AddToCalendarMenu plan={plan} align="right" />}
        </div>
        <ul className="grid gap-3 text-sm sm:grid-cols-3">
          <InfoItem icon={CalendarDays}>
            <span className="first-letter:uppercase">{formatDateTime(plan.scheduled_at)}</span>
          </InfoItem>
          <InfoItem icon={Users}>
            {plan.party_size} {plan.party_size === 1 ? "persona" : "personas"}
          </InfoItem>
          <InfoItem icon={Bell}>
            {plan.reminder_minutes_before ? REMINDER_LABEL[plan.reminder_minutes_before] : "Sin recordatorio"}
            {plan.reminder_sent_at ? " (enviado)" : ""}
          </InfoItem>
        </ul>
        {plan.notes && <p className="whitespace-pre-line rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm text-[#43506a]">{plan.notes}</p>}

        <div className="flex flex-wrap gap-2 border-t border-[#eceef7] pt-4">
          {editable && plan.establishment_available && (
            <Link
              href={`/plans/${plan.id}/edit`}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#514ddd] px-4 text-sm font-bold text-white hover:bg-[#4542ca]"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Link>
          )}
          {editable && (
            <button
              type="button"
              onClick={() => setConfirm("cancel")}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#d7dcf2] bg-white px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5ff]"
            >
              <XCircle aria-hidden="true" className="size-4" />
              Cancelar plan
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirm("delete")}
            className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Eliminar
          </button>
          {plan.status === "COMPLETED" && (
            <Link
              href={`/establishments/${plan.establishment.id}?review=1#reviews`}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#e3f7f3] px-4 text-sm font-bold text-[#0b6b5c] hover:bg-[#d3f1eb]"
            >
              <MessageSquarePlus aria-hidden="true" className="size-4" />
              ¿Cómo te fue? Deja tu reseña
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className={`${card} space-y-4`}>
          <h2 className="text-lg font-extrabold">Menú del plan</h2>
          {plan.items.length === 0 ? (
            <p className="text-sm text-[#6d6e7a]">No elegiste platos para este plan.</p>
          ) : (
            <ul className="divide-y divide-[#eceef7]">
              {plan.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {item.quantity}× {item.name}
                    </p>
                    <p className="text-xs text-[#6d6e7a]">{formatCop(item.unit_price)} c/u</p>
                    {item.notes && <p className="text-xs italic text-[#6d6e7a]">“{item.notes}”</p>}
                    {item.price_changed && (
                      <p className="text-xs font-semibold text-amber-700">
                        {item.current_price === null ? "Ya no está disponible" : `Precio actual: ${formatCop(item.current_price)}`}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-bold">{formatCop(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          )}
          {total > 0 && (
            <div className="flex items-baseline justify-between border-t border-[#eceef7] pt-3">
              <span className="text-sm font-semibold text-[#43506a]">Total estimado</span>
              <span className="text-xl font-extrabold text-[#514ddd]">{formatCop(total)}</span>
            </div>
          )}
          <p className="text-xs text-[#6d6e7a]">El total es estimado; el establecimiento puede cambiar sus precios.</p>
        </section>

        <section className={`${card} space-y-4`}>
          <h2 className="text-lg font-extrabold">Lugar</h2>
          <Link href={`/establishments/${plan.establishment.id}`} className="block font-bold text-[#514ddd] hover:underline">
            {plan.establishment.name}
          </Link>
          {point && (
            <StaticLocationMap latitude={point.lat} longitude={point.lng} name={plan.establishment.name} className="h-44" />
          )}
          <p className="text-sm text-[#43506a]">{plan.establishment.address}</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#514ddd] text-xs font-bold text-white hover:bg-[#4542ca]"
            >
              <Navigation aria-hidden="true" className="size-3.5" />
              Cómo llegar
            </a>
            <a
              href={point ? mapsSearchUrl(point.lat, point.lng) : routeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#eef0ff] text-xs font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              Google Maps
            </a>
          </div>
        </section>
      </div>

      {confirm && (
        <Modal title={confirm === "delete" ? "Eliminar plan" : "Cancelar plan"} onClose={() => !isWorking && setConfirm(null)}>
          <p className="text-sm text-[#43506a]">
            {confirm === "delete"
              ? "El plan se borrará de tu historial. Esta acción no se puede deshacer."
              : "El plan quedará como cancelado en tu historial y no recibirás el recordatorio."}
          </p>
          {confirm === "cancel" && (
            <p className="mt-2 text-xs text-[#6d6e7a]">Si lo agregaste a tu calendario, elimínalo también de allí.</p>
          )}
          {actionError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={isWorking}
              className="h-10 rounded-xl px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5ff]"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => void runAction()}
              disabled={isWorking}
              className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isWorking ? "Procesando..." : confirm === "delete" ? "Eliminar" : "Cancelar plan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, children }: { icon: typeof CalendarDays; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-xl bg-[#f3f5ff] px-4 py-3 font-semibold text-[#26344d]">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
      <span>{children}</span>
    </li>
  );
}

function Banner({ tone, icon: Icon, children }: { tone: "success" | "warning"; icon: typeof CalendarDays; children: ReactNode }) {
  const toneClass = tone === "success" ? "bg-[#e3f7f3] text-[#0b4a40]" : "bg-amber-50 text-amber-800";
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${toneClass}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-0.5">{children}</div>
    </div>
  );
}
