"use client";

import { CheckCircle2, Flag, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import Modal from "@/components/ui/Modal";
import { ApiError } from "@/lib/auth-api";
import { createReport, REPORT_DETAILS_MAX, REPORT_REASON_LABEL, type ReportReason, type ReportTargetType } from "@/lib/reports-api";

type ReportDialogProps = {
  targetType: ReportTargetType;
  targetId: number;
  // "esta reseña", "esta respuesta", "este lugar"…
  targetLabel: string;
  onClose: () => void;
};

function reportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Ya reportaste este contenido. Lo estamos revisando.";
    if (error.status === 429) return "Alcanzaste el límite de reportes por hoy. Intenta mañana.";
    return error.message;
  }
  return error instanceof Error ? error.message : "No fue posible enviar el reporte.";
}

// Motivo (radio) + detalle opcional. Reutilizable para reseñas, respuestas, imágenes y establecimientos.
export default function ReportDialog({ targetType, targetId, targetLabel, onClose }: ReportDialogProps) {
  const id = useId();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!reason) {
      setError("Elige un motivo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createReport({ target_type: targetType, target_id: targetId, reason, details: details.trim() || null });
      setSent(true);
    } catch (caught) {
      setError(reportErrorMessage(caught));
      // Ya reportado: se muestra como confirmación, no como fallo.
      if (caught instanceof ApiError && caught.status === 409) setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Modal title="Reporte enviado" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 aria-hidden="true" className="size-10 text-[#0b6b5c]" />
          <p role="status" className="text-sm text-[#43506a]">
            {error || "Gracias por avisarnos. Un administrador lo revisará y te notificaremos cuando tome una decisión."}
          </p>
          <button type="button" onClick={onClose} className="mt-2 rounded-xl bg-[#514ddd] px-5 py-2 text-sm font-bold text-white hover:bg-[#4542ca]">
            Entendido
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Reportar ${targetLabel}`} onClose={busy ? () => undefined : onClose}>
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#26344d]">¿Qué problema tiene?</legend>
          {(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                reason === value ? "border-[#514ddd] bg-[#eef0ff] font-semibold" : "border-[#e4e6f0] hover:bg-[#f8f9ff]"
              }`}
            >
              <input type="radio" name={`${id}-reason`} checked={reason === value} onChange={() => setReason(value)} className="accent-[#514ddd]" />
              {REPORT_REASON_LABEL[value]}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-details`} className="text-sm font-semibold text-[#26344d]">
            Detalles <span className="font-normal text-[#6d6e7a]">(opcional)</span>
          </label>
          <textarea
            id={`${id}-details`}
            rows={3}
            maxLength={REPORT_DETAILS_MAX}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Cuéntanos qué viste."
            className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40"
          />
        </div>
        <p className="text-xs text-[#6d6e7a]">
          Revisamos los reportes según las{" "}
          <Link href="/legal/community-guidelines" className="font-semibold text-[#514ddd] hover:underline">
            normas de la comunidad
          </Link>
          . Quien publicó el contenido no sabrá que lo reportaste.
        </p>
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
          className="flex items-center gap-2 rounded-xl bg-[#d6154a] px-4 py-2 text-sm font-bold text-white hover:bg-[#b8113f] disabled:opacity-50"
        >
          {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Enviar reporte
        </button>
      </div>
    </Modal>
  );
}

type ReportButtonProps = Omit<ReportDialogProps, "onClose"> & {
  // Id de quien publicó el contenido: no se ofrece reportar lo propio (el backend respondería 400).
  ownerId?: number | null;
  className?: string;
  label?: string;
};

// "Reportar": sin sesión lleva al login; los administradores moderan directamente y no lo ven.
export function ReportButton({ ownerId, className = "", label = "Reportar", ...target }: ReportButtonProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (isLoading || user?.role === "admin" || (user && ownerId != null && user.id === ownerId)) return null;

  const classes = `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6d6e7a] hover:bg-[#fde8ea] hover:text-[#a30f35] ${className}`;
  const content = (
    <>
      <Flag aria-hidden="true" className="size-3.5" />
      {label}
    </>
  );

  if (!user) {
    return (
      <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className={classes} aria-label={`${label} ${target.targetLabel} (inicia sesión)`}>
        {content}
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={classes} aria-label={`${label} ${target.targetLabel}`}>
        {content}
      </button>
      {open && <ReportDialog {...target} onClose={() => setOpen(false)} />}
    </>
  );
}
