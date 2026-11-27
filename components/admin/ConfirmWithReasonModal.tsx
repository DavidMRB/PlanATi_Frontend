"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import { REASON_MAX, REASON_MIN } from "@/lib/admin-api";

type ConfirmWithReasonModalProps = {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  reasonLabel?: string;
  placeholder?: string;
  // Obligatorio (5..1000) para suspender, borrar o rechazar; opcional para reactivar o restaurar.
  required?: boolean;
  tone?: "danger" | "primary";
  // Contenido extra bajo el motivo (p. ej. "Suspender también su establecimiento").
  extra?: ReactNode;
  featured?: boolean;
  onClose: () => void;
  // Lanza un Error con el mensaje del backend si falla; el modal lo muestra y sigue abierto.
  onConfirm: (reason: string) => Promise<void>;
};

// Confirmación con motivo. El motivo queda en la bitácora y, según la acción, se envía al afectado.
export default function ConfirmWithReasonModal({
  title,
  description,
  confirmLabel,
  reasonLabel = "Motivo",
  placeholder,
  required = true,
  tone = "danger",
  extra,
  featured = false,
  onClose,
  onConfirm,
}: ConfirmWithReasonModalProps) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const length = reason.trim().length;
  const valid = required ? length >= REASON_MIN && length <= REASON_MAX : length <= REASON_MAX;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(reason.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible completar la acción.");
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={busy ? () => undefined : onClose} blurBackdrop={featured} titleIcon={featured ? <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fde0e3] text-[#a30f35]"><TriangleAlert aria-hidden="true" className="size-5" /></span> : undefined}>
      <div className="space-y-4">
        {description && <div className="text-sm leading-relaxed text-[#43506a]">{description}</div>}
        <div className="space-y-2">
          <label htmlFor={id} className="text-sm font-semibold text-[#26344d]">
            {reasonLabel}
            {!required && <span className="font-normal text-[#6d6e7a]"> (opcional)</span>}
          </label>
          <textarea
            id={id}
            rows={4}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={placeholder}
            aria-describedby={`${id}-help`}
            className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40"
          />
          <p id={`${id}-help`} className="flex justify-between text-xs text-[#6d6e7a]">
            <span>{required ? `Entre ${REASON_MIN} y ${REASON_MAX} caracteres. Queda en la bitácora.` : "Queda en la bitácora."}</span>
            <span>
              {length}/{REASON_MAX}
            </span>
          </p>
        </div>
        {extra}
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full bg-[#eef0ff] px-4 py-2 text-sm font-semibold text-[#43506a] hover:bg-[#e2e5ff]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!valid || busy}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
            tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#514ddd] hover:bg-[#4542ca]"
          }`}
        >
          {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
