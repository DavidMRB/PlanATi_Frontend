"use client";

import { AlertTriangle, ArrowLeft, Check, Loader2, MapPin, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { formatCop } from "@/lib/format";
import { PLAN_LIMITS, REMINDER_LABEL, type PlanDetail } from "@/lib/plans-api";
import MenuItemPicker from "./MenuItemPicker";
import { STEPS, usePlanBuilder } from "./PlanBuilder.ts";
import PlanSummary, { summaryTotal } from "./PlanSummary";
import ReminderSelect from "./ReminderSelect";
import TimeSlotPicker from "./TimeSlotPicker";

type PlanBuilderProps = { establishmentId: number; plan?: undefined } | { plan: PlanDetail; establishmentId?: undefined };

const inputClass =
  "w-full rounded-xl border border-[#d7dcf2] bg-[#f5f6ff] px-3 text-sm text-[#17243d] outline-none focus:ring-2 focus:ring-[#6868e8]/40";
const primaryButton =
  "flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca] disabled:opacity-60";

// Asistente para crear o editar un plan (sección 7.6 del plan de la fase 2): fecha y hora, menú opcional,
// detalles y resumen. Los errores del backend vuelven al paso que corresponde.
export default function PlanBuilder(props: PlanBuilderProps) {
  const builder = usePlanBuilder(
    props.plan ? { kind: "edit", plan: props.plan } : { kind: "create", establishmentId: props.establishmentId },
  );
  const { detail, editing, step, errors } = builder;

  if (builder.loadError) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{builder.loadError}</p>
        <Link href="/plans/new" className="text-sm font-semibold text-[#514ddd]">
          Elegir otro lugar
        </Link>
      </div>
    );
  }
  if (!detail) return <p className="py-10 text-center text-sm text-[#6d6e7a]">Cargando el lugar...</p>;

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const isLast = Boolean(editing) || step === "summary";
  const action = (
    <button
      type="button"
      onClick={isLast ? () => void builder.submit() : builder.next}
      disabled={builder.isSubmitting}
      className={primaryButton}
    >
      {builder.isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {isLast ? (editing ? "Guardar cambios" : "Crear plan") : "Continuar"}
    </button>
  );

  return (
    <div className="grid items-start gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-0">
      <div className="min-w-0 space-y-6">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef0ff] text-[#514ddd]">
            {detail.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
              <img src={detail.profile_image_url} alt="" className="size-full object-cover" />
            ) : (
              <MapPin aria-hidden="true" className="size-6" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {editing && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#514ddd]">Establecimiento del plan</p>}
            <p className="truncate text-base font-bold text-[#17243d]">{detail.name}</p>
            <p className="truncate text-xs text-[#6d6e7a]">{detail.address}</p>
          </div>
          {!editing && (
            <Link href="/plans/new" className="shrink-0 text-xs font-semibold text-[#514ddd] hover:underline">
              Cambiar lugar
            </Link>
          )}
        </div>

        {!editing && <nav aria-label="Pasos del plan" className="rounded-2xl bg-white p-3">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const done = index < stepIndex;
              const current = index === stepIndex;
              return (
                <li key={item.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => builder.goTo(item.id)}
                    aria-current={current ? "step" : undefined}
                    className={`flex h-9 w-full items-center gap-2 rounded-xl px-2 text-left text-xs font-bold transition ${
                      current
                        ? "bg-[#514ddd] text-white"
                        : done
                          ? "bg-[#e3f7f3] text-[#0b6b5c]"
                          : "bg-[#eef0ff] text-[#43506a] hover:text-[#514ddd]"
                      } ${errors[item.id] ? "ring-2 ring-red-300" : ""}`}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-white/25">
                      {done ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>}

        <div className="space-y-4">
          {(editing || step === "when") && (
            <section className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
              <StepTitle title={editing ? "Fecha y hora de la visita" : "¿Cuándo vas?"} subtitle="Horas de Colombia, según los horarios del lugar." />
              {editing?.outside_schedule && (
                <Warning>Con los horarios actuales el lugar ya no abre a la hora de este plan. Elige otra hora.</Warning>
              )}
              <TimeSlotPicker
                schedules={builder.schedules}
                date={builder.date}
                time={builder.time}
                onDateChange={builder.changeDate}
                onTimeChange={builder.changeTime}
                now={builder.now}
                error={errors.when}
                showDateStrip={Boolean(editing)}
              />
            </section>
          )}

          {(editing || step === "menu") && (
            <section className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
              <StepTitle title={editing ? "Combos y productos vinculados" : "¿Qué vas a pedir?"} subtitle="Opcional. Sirve para estimar cuánto vas a gastar." />
              {editing && builder.missingIds.length > 0 && (
                <Warning>Algunos platos de este plan ya no están disponibles. Si cambias los platos, se quitarán.</Warning>
              )}
              {editing && (
                <p className="text-xs text-[#6d6e7a]">Si cambias los platos, el total se recalcula con los precios actuales.</p>
              )}
              <MenuItemPicker
                products={detail.products}
                combos={detail.combos}
                selection={builder.selection}
                onChange={builder.setSelection}
                invalidIds={builder.invalidIds}
              />
              {errors.menu && <ErrorText>{errors.menu}</ErrorText>}
            </section>
          )}

          {(editing || step === "details") && (
            <section className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
              <StepTitle title="Detalles" />
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#26344d]">Título</span>
                <input
                  type="text"
                  value={builder.title}
                  maxLength={PLAN_LIMITS.titleMax}
                  onChange={(event) => builder.setTitle(event.target.value)}
                  placeholder={`Plan en ${detail.name}`}
                  className={`${inputClass} h-11`}
                />
              </label>
              <div className="space-y-1.5">
                <label htmlFor="plan-party-size" className="block text-sm font-semibold text-[#26344d]">Personas</label>
                <div className="inline-flex items-center gap-1 rounded-xl bg-[#eef0ff] p-1">
                  <button type="button" aria-label="Reducir número de personas" disabled={Number(builder.partySize) <= 1} onClick={() => builder.setPartySize(String(Math.max(1, Number(builder.partySize) - 1)))} className="grid size-9 place-items-center rounded-lg bg-white text-[#514ddd] disabled:opacity-50"><Minus aria-hidden="true" className="size-4" /></button>
                  <input
                    id="plan-party-size"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={PLAN_LIMITS.maxPartySize}
                    value={builder.partySize}
                    onChange={(event) => builder.setPartySize(event.target.value)}
                    className="h-9 w-14 appearance-none rounded-lg bg-transparent text-center text-sm font-bold outline-none focus:ring-2 focus:ring-[#514ddd] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button type="button" aria-label="Aumentar número de personas" disabled={Number(builder.partySize) >= PLAN_LIMITS.maxPartySize} onClick={() => builder.setPartySize(String(Math.min(PLAN_LIMITS.maxPartySize, Number(builder.partySize) + 1)))} className="grid size-9 place-items-center rounded-lg bg-[#514ddd] text-white disabled:opacity-50"><Plus aria-hidden="true" className="size-4" /></button>
                </div>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#26344d]">Recordatorio</span>
                <ReminderSelect value={builder.reminder} onChange={builder.setReminder} scheduledAt={builder.scheduledAt} now={builder.now} />
                <span className="block text-xs text-[#6d6e7a]">Te avisaremos en la campana de notificaciones.</span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#26344d]">Notas</span>
                <textarea
                  value={builder.notes}
                  maxLength={PLAN_LIMITS.notesMax}
                  rows={3}
                  onChange={(event) => builder.setNotes(event.target.value)}
                  placeholder="Cumpleaños, mesa afuera, quién lleva el pastel..."
                  className={`${inputClass} py-2.5`}
                />
              </label>
              {errors.details && <ErrorText>{errors.details}</ErrorText>}
            </section>
          )}

          {!editing && step === "summary" && (
            <section className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
              <StepTitle title="Revisa tu plan" />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <SummaryItem label="Título" value={builder.title.trim() || `Plan en ${detail.name}`} />
                <SummaryItem label="Fecha y hora" value={builder.whenLabel ?? "—"} capitalize />
                <SummaryItem label="Personas" value={builder.partySize} />
                <SummaryItem label="Recordatorio" value={builder.reminder ? REMINDER_LABEL[builder.reminder] : "Sin recordatorio"} />
              </dl>
              {builder.notes.trim() && <p className="whitespace-pre-line rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm text-[#43506a]">{builder.notes.trim()}</p>}
              {builder.lines.length > 0 ? (
                <ul className="divide-y divide-[#eceef7] rounded-2xl ring-1 ring-[#eceef7]">
                  {builder.lines.map((line) => (
                    <li key={line.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0 text-[#43506a]">
                        {line.quantity}× {line.name}
                      </span>
                      <span className="shrink-0 font-semibold">{formatCop(line.unitPrice * line.quantity)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between px-4 py-3 text-sm font-bold">
                    <span>Total estimado</span>
                    <span className="text-[#514ddd]">{formatCop(summaryTotal(builder.lines))}</span>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-[#6d6e7a]">Sin platos elegidos.</p>
              )}
              <p className="text-xs text-[#6d6e7a]">El total es estimado; el establecimiento puede cambiar sus precios.</p>
              {errors.summary && <ErrorText>{errors.summary}</ErrorText>}
            </section>
          )}

          {editing && errors.summary && <ErrorText>{errors.summary}</ErrorText>}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
            {editing ? (
              <Link href={`/plans/${editing.id}`} className="rounded-xl bg-[#eef0ff] px-3 py-2.5 text-sm font-bold text-[#514ddd]">Descartar cambios</Link>
            ) : stepIndex > 0 ? (
              <button type="button" onClick={builder.back} className="flex items-center gap-1.5 text-sm font-semibold text-[#514ddd]">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Atrás
              </button>
            ) : (
              <span />
            )}
            <div className="hidden lg:block">{action}</div>
          </div>
        </div>
      </div>

      <PlanSummary
        establishmentName={detail.name}
        coverImage={detail.banner_image_url ?? detail.profile_image_url}
        when={builder.whenLabel}
        partySize={Number(builder.partySize) || 1}
        lines={builder.lines}
        action={<div className="lg:hidden">{action}</div>}
      />
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-extrabold text-[#17243d]">{title}</h2>
      {subtitle && <p className="text-sm text-[#6d6e7a]">{subtitle}</p>}
    </div>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {children}
    </p>
  );
}

function SummaryItem({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-xl bg-[#f3f5ff] px-4 py-3">
      <dt className="text-xs font-semibold text-[#6d6e7a]">{label}</dt>
      <dd className={`mt-0.5 font-bold text-[#17243d] ${capitalize ? "first-letter:uppercase" : ""}`}>{value}</dd>
    </div>
  );
}
