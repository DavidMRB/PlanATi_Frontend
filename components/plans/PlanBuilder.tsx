"use client";

import { AlertTriangle, ArrowLeft, Check, Loader2, MapPin } from "lucide-react";
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
  "w-full rounded-xl border border-[#d7dcf2] bg-white px-3 text-sm text-[#17243d] outline-none focus:ring-2 focus:ring-[#6868e8]/40";
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
  const isLast = step === "summary";
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
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-0">
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
            <p className="truncate text-base font-bold text-[#17243d]">{detail.name}</p>
            <p className="truncate text-xs text-[#6d6e7a]">{detail.address}</p>
          </div>
          {!editing && (
            <Link href="/plans/new" className="shrink-0 text-xs font-semibold text-[#514ddd] hover:underline">
              Cambiar lugar
            </Link>
          )}
        </div>

        <nav aria-label="Pasos del plan">
          <ol className="flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((item, index) => {
              const done = index < stepIndex;
              const current = index === stepIndex;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => builder.goTo(item.id)}
                    aria-current={current ? "step" : undefined}
                    className={`flex h-9 items-center gap-2 rounded-full px-3 text-xs font-bold transition ${
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
        </nav>

        <section className="space-y-5 rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
          {step === "when" && (
            <>
              <StepTitle title="¿Cuándo vas?" subtitle="Horas de Colombia, según los horarios del lugar." />
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
              />
            </>
          )}

          {step === "menu" && (
            <>
              <StepTitle title="¿Qué vas a pedir?" subtitle="Opcional. Sirve para estimar cuánto vas a gastar." />
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
            </>
          )}

          {step === "details" && (
            <>
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
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#26344d]">Personas</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={PLAN_LIMITS.maxPartySize}
                  value={builder.partySize}
                  onChange={(event) => builder.setPartySize(event.target.value)}
                  className={`${inputClass} h-11 max-w-32`}
                />
              </label>
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
            </>
          )}

          {step === "summary" && (
            <>
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
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[#eceef7] pt-4">
            {stepIndex > 0 ? (
              <button type="button" onClick={builder.back} className="flex items-center gap-1.5 text-sm font-semibold text-[#514ddd]">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Atrás
              </button>
            ) : (
              <span />
            )}
            <div className="hidden lg:block">{action}</div>
          </div>
        </section>
      </div>

      <PlanSummary
        establishmentName={detail.name}
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
