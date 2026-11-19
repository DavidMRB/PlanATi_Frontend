"use client";

import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import BlockedContentNotice from "@/components/reviews/BlockedContentNotice";
import Modal from "@/components/ui/Modal";
import { REASON_MAX, type ModerationCategory } from "@/lib/admin-api";
import { MODERATION_CATEGORY_LABEL } from "@/lib/reviews-api";

export type ModerationKind = "block-comment" | "block-reply" | "hide";

export type ModerationDecision = { category: ModerationCategory; note: string | null; remove_images: boolean };

const COPY: Record<ModerationKind, { title: string; confirm: string; help: string }> = {
  "block-comment": {
    title: "Bloquear comentario",
    confirm: "Bloquear comentario",
    help: "El texto deja de verse en público y en el panel del establecimiento. Las estrellas siguen contando en el promedio y el autor ve su texto original con la categoría.",
  },
  "block-reply": {
    title: "Bloquear respuesta del establecimiento",
    confirm: "Bloquear respuesta",
    help: "La respuesta deja de verse en público. El establecimiento recibe un aviso y puede reescribirla; tendrás que revisarla antes de publicarla.",
  },
  hide: {
    title: "Ocultar reseña",
    confirm: "Ocultar reseña",
    help: "Para spam o reseñas falsas: la reseña completa desaparece del público y sale del promedio. El autor recibe un aviso con la categoría.",
  },
};

// Textos de app/models/review.py (BLOCKED_COMMENT_NOTICE y BLOCKED_REPLY_NOTICE).
const PUBLIC_NOTICE: Record<ModerationKind, string> = {
  "block-comment": "El comentario fue bloqueado por una violación a las políticas de la aplicación.",
  "block-reply": "La respuesta fue bloqueada por una violación a las políticas de la aplicación.",
  hide: "",
};

type ModerationActionModalProps = {
  kind: ModerationKind;
  // Muestra la casilla "Quitar también las imágenes" (solo al bloquear el comentario de una reseña con fotos).
  hasImages?: boolean;
  onClose: () => void;
  onConfirm: (decision: ModerationDecision) => Promise<void>;
};

// Bloquear comentario o respuesta, u ocultar reseña: categoría obligatoria, nota opcional para el autor y
// vista previa de lo que verá el público.
export default function ModerationActionModal({ kind, hasImages = false, onClose, onConfirm }: ModerationActionModalProps) {
  const id = useId();
  const [category, setCategory] = useState<ModerationCategory | "">("");
  const [note, setNote] = useState("");
  const [removeImages, setRemoveImages] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const copy = COPY[kind];

  const submit = async () => {
    if (!category) {
      setError("Elige la categoría de la infracción.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm({ category, note: note.trim() || null, remove_images: kind === "block-comment" && removeImages });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible aplicar la acción.");
      setBusy(false);
    }
  };

  return (
    <Modal title={copy.title} onClose={busy ? () => undefined : onClose} widthClass="max-w-xl">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-[#43506a]">{copy.help}</p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#26344d]">Categoría</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(MODERATION_CATEGORY_LABEL) as ModerationCategory[]).map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  category === value ? "border-[#514ddd] bg-[#eef0ff] font-semibold" : "border-[#e4e6f0] hover:bg-[#f8f9ff]"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-category`}
                  value={value}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                  className="accent-[#514ddd]"
                />
                {MODERATION_CATEGORY_LABEL[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor={`${id}-note`} className="text-sm font-semibold text-[#26344d]">
            Nota para el autor <span className="font-normal text-[#6d6e7a]">(opcional)</span>
          </label>
          <textarea
            id={`${id}-note`}
            rows={3}
            maxLength={REASON_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ej.: Contiene insultos al personal."
            className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40"
          />
        </div>

        {kind === "block-comment" && hasImages && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeImages}
              onChange={(event) => setRemoveImages(event.target.checked)}
              className="size-4 accent-[#d6154a]"
            />
            Quitar también las imágenes de la reseña
          </label>
        )}

        {kind !== "hide" && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6d6e7a]">Así lo verá el público</p>
            <BlockedContentNotice notice={PUBLIC_NOTICE[kind]} />
          </div>
        )}

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
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-[#d6154a] px-4 py-2 text-sm font-bold text-white hover:bg-[#b8113f] disabled:opacity-50"
        >
          {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {copy.confirm}
        </button>
      </div>
    </Modal>
  );
}
