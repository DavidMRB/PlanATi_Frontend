"use client";

import { CheckCircle2, ExternalLink, Flag, Gavel, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import StarRating from "@/components/reviews/StarRating";
import Modal from "@/components/ui/Modal";
import {
  dismissReport,
  REASON_MAX,
  RESOLVE_ACTION_LABEL,
  RESOLVE_ACTIONS_BY_TARGET,
  resolveReport,
  TARGET_TYPE_LABEL,
  type AdminReport,
  type ModerationCategory,
  type ResolveAction,
} from "@/lib/admin-api";
import { formatDate, timeAgo } from "@/lib/datetime";
import { REPORT_REASON_LABEL, type ReportReason } from "@/lib/reports-api";
import { MODERATION_CATEGORY_LABEL } from "@/lib/reviews-api";
import ConfirmWithReasonModal from "./ConfirmWithReasonModal";

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  OPEN: { label: "Abierto", tone: "bg-[#fde0e3] text-[#a30f35]" },
  RESOLVED: { label: "Resuelto", tone: "bg-emerald-100 text-emerald-700" },
  DISMISSED: { label: "Descartado", tone: "bg-slate-200 text-slate-700" },
};

// Enlace para ver el contenido reportado en su contexto.
function targetLink(report: AdminReport): string | null {
  const { preview } = report;
  if (!preview.exists) return null;
  switch (report.target_type) {
    case "REVIEW":
    case "REVIEW_REPLY":
    case "REVIEW_IMAGE":
      return preview.establishment_id
        ? `/establishments/${preview.establishment_id}${preview.review_id ? `#review-${preview.review_id}` : ""}`
        : null;
    case "ESTABLISHMENT":
    case "ESTABLISHMENT_IMAGE":
    case "MENU_ITEM":
      return preview.establishment_id ? `/admin/establishments/${preview.establishment_id}` : null;
    case "USER":
      return preview.owner_id ? `/admin/users/${preview.owner_id}` : null;
    default:
      return null;
  }
}

// Reporte con la vista previa del destino (texto original aunque esté bloqueado) y acciones Resolver/Descartar.
// Resolver o descartar cierra todos los reportes abiertos del mismo destino.
export default function ReportCard({ report, onChange }: { report: AdminReport; onChange: (report: AdminReport, message: string) => void }) {
  const [dialog, setDialog] = useState<"resolve" | "dismiss" | null>(null);
  const { preview } = report;
  const open = report.status === "OPEN";
  const status = STATUS_LABEL[report.status] ?? { label: report.status, tone: "bg-slate-100 text-slate-700" };
  const link = targetLink(report);

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.06)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[#514ddd]">{TARGET_TYPE_LABEL[report.target_type] ?? report.target_type}</span>
            <span className={`rounded-full px-2.5 py-1 ${status.tone}`}>{status.label}</span>
            {open && report.reports_on_target > 1 && (
              <span className="flex items-center gap-1 rounded-full bg-[#fde0e3] px-2.5 py-1 text-[#a30f35]">
                <Flag aria-hidden="true" className="size-3" />
                {report.reports_on_target} reportes abiertos sobre este contenido
              </span>
            )}
          </div>
          <p className="break-words text-sm">
            <span className="font-bold">{REPORT_REASON_LABEL[report.reason as ReportReason] ?? report.reason}</span>
            <span className="text-[#6d6e7a]">
              {" "}
              · reportado por {report.reporter_name ?? "una cuenta eliminada"}
              {report.reporter_email ? ` (${report.reporter_email})` : ""} ·{" "}
              <time dateTime={report.created_at} title={formatDate(report.created_at)}>
                {timeAgo(report.created_at).toLowerCase()}
              </time>
            </span>
          </p>
          {report.details && <p className="text-sm text-[#43506a]">“{report.details}”</p>}
        </div>
        {link && (
          <Link href={link} className="flex items-center gap-1 text-xs font-semibold text-[#514ddd] hover:underline">
            Ver en contexto
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-2 rounded-xl bg-[#eef2ff] p-4 text-sm">
        {!preview.exists ? (
          <p className="italic text-[#6d6e7a]">El contenido ya no existe. Puedes cerrar el reporte sin acción o descartarlo.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6d6e7a]">
              {preview.name && <span className="font-bold text-[#17243d]">{preview.name}</span>}
              {preview.owner_name && <span>de {preview.owner_name}</span>}
              {preview.establishment_name && <span>en {preview.establishment_name}</span>}
              {preview.rating !== null && <StarRating value={preview.rating} starClassName="size-3.5" />}
              {!preview.visible && <span className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-slate-700">No visible</span>}
              {preview.comment_status === "BLOCKED" && <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">Bloqueado</span>}
              {preview.is_available === false && <span className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-slate-700">No disponible</span>}
            </div>
            {preview.text && <p className="whitespace-pre-line text-[#26344d]">{preview.text}</p>}
            {preview.image_url && (
              <a href={preview.image_url} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
                <img src={preview.image_url} alt="Contenido reportado" className="max-h-40 rounded-lg object-cover" />
              </a>
            )}
          </>
        )}
      </div>

      {!open && report.resolution_note && (
        <p className="text-xs text-[#6d6e7a]">
          Nota de cierre: <span className="text-[#26344d]">{report.resolution_note}</span>
          {report.resolved_at ? ` · ${formatDate(report.resolved_at)}` : ""}
        </p>
      )}

      {open && (
        <div className="grid gap-2 border-t border-[#f0f2f8] pt-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDialog("resolve")}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#514ddd] px-3 py-2 text-xs font-bold text-white hover:bg-[#4542ca]"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Resolver
          </button>
          <button
            type="button"
            onClick={() => setDialog("dismiss")}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#e3f7f3] px-3 py-2 text-xs font-bold text-[#0b6b5c] hover:bg-emerald-100 sm:order-first"
          >
            <XCircle aria-hidden="true" className="size-4" />
            Descartar
          </button>
        </div>
      )}

      {dialog === "resolve" && (
        <ResolveReportModal
          report={report}
          onClose={() => setDialog(null)}
          onResolved={(updated) => {
            setDialog(null);
            onChange(updated, "Reporte resuelto. Se avisó a quienes reportaron.");
          }}
        />
      )}
      {dialog === "dismiss" && (
        <ConfirmWithReasonModal
          title="Descartar reporte"
          description="Se cierran todos los reportes abiertos sobre este contenido sin aplicar ninguna acción. Quienes reportaron reciben un aviso."
          confirmLabel="Descartar"
          reasonLabel="Nota"
          required={false}
          tone="primary"
          onClose={() => setDialog(null)}
          onConfirm={async (note) => {
            const updated = await dismissReport(report.id, note);
            setDialog(null);
            if (updated) onChange(updated, "Reporte descartado.");
          }}
        />
      )}
    </li>
  );
}

function ResolveReportModal({
  report,
  onClose,
  onResolved,
}: {
  report: AdminReport;
  onClose: () => void;
  onResolved: (report: AdminReport) => void;
}) {
  const id = useId();
  // Si el contenido ya no existe solo se puede cerrar sin acción.
  const actions: ResolveAction[] = report.preview.exists ? RESOLVE_ACTIONS_BY_TARGET[report.target_type] : ["NONE"];
  const [action, setAction] = useState<ResolveAction>(actions.length > 1 ? actions[1] : "NONE");
  const [category, setCategory] = useState<ModerationCategory | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const needsCategory = action !== "NONE";

  const submit = async () => {
    if (needsCategory && !category) {
      setError("Elige la categoría de la infracción.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await resolveReport(report.id, {
        action,
        category: needsCategory ? (category as ModerationCategory) : null,
        note: note.trim() || null,
      });
      if (updated) onResolved(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible resolver el reporte.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Confirmar resolución de reporte" onClose={busy ? () => undefined : onClose} widthClass="max-w-xl" blurBackdrop titleIcon={<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef0ff] text-[#514ddd]"><Gavel aria-hidden="true" className="size-5" /></span>}>
      <div className="space-y-5">
        <p className="rounded-xl bg-[#eef0ff] px-3 py-2 text-sm text-[#43506a]">Reporte #{report.id} · {TARGET_TYPE_LABEL[report.target_type] ?? report.target_type}</p>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Acción</legend>
          {actions.map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                action === value ? "border-[#514ddd] bg-[#eef0ff] font-semibold" : "border-[#e4e6f0] hover:bg-[#f8f9ff]"
              }`}
            >
              <input type="radio" name={`${id}-action`} checked={action === value} onChange={() => setAction(value)} className="accent-[#514ddd]" />
              {RESOLVE_ACTION_LABEL[report.target_type][value] ?? value}
            </label>
          ))}
        </fieldset>

        {needsCategory && (
          <div className="space-y-2">
            <label htmlFor={`${id}-category`} className="text-sm font-semibold">
              Categoría
            </label>
            <select
              id={`${id}-category`}
              value={category}
              onChange={(event) => setCategory(event.target.value as ModerationCategory)}
              className="h-11 w-full rounded-xl bg-[#eef2ff] px-3 text-sm outline-none focus:ring-2 focus:ring-[#6868e8]/40"
            >
              <option value="">Elige una categoría</option>
              {Object.entries(MODERATION_CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor={`${id}-note`} className="text-sm font-semibold">
            Nota <span className="font-normal text-[#6d6e7a]">(opcional; se envía al afectado y a quienes reportaron)</span>
          </label>
          <textarea
            id={`${id}-note`}
            rows={3}
            maxLength={REASON_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Escribe una nota sobre la resolución."
            className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40"
          />
        </div>

        <p className="text-xs text-[#6d6e7a]">Se cerrarán todos los reportes abiertos sobre este contenido.</p>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-50"
        >
          {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Confirmar resolución
        </button>
      </div>
    </Modal>
  );
}
