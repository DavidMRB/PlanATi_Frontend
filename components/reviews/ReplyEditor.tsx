"use client";

import { Loader2, MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { formatDate, timeAgo } from "@/lib/datetime";
import { deleteReviewReply, REPLY_MAX_LENGTH, upsertReviewReply } from "@/lib/restaurant-api";
import type { Review } from "@/lib/reviews-api";
import BlockedContentNotice from "./BlockedContentNotice";

type ReplyEditorProps = {
  review: Review;
  establishmentName: string;
  // Reseña con la respuesta nueva (o sin respuesta tras eliminarla).
  onChange: (review: Review) => void;
};

// Respuesta del establecimiento a una reseña (panel del restaurante): responder, editar o eliminar.
// Si la respuesta fue bloqueada por moderación, el panel solo recibe el aviso: puede reescribirla y un
// administrador la revisará antes de publicarla.
export default function ReplyEditor({ review, establishmentName, onChange }: ReplyEditorProps) {
  const reply = review.reply;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = `reply-${review.id}`;

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    // De una respuesta bloqueada no llega el texto: se reescribe desde cero.
    setText(reply && !reply.comment_blocked ? (reply.comment ?? "") : "");
    setError("");
    setEditing(true);
  };

  const save = async () => {
    const comment = text.trim();
    if (!comment) {
      setError("Escribe tu respuesta.");
      return;
    }
    if (comment.length > REPLY_MAX_LENGTH) {
      setError(`La respuesta no puede superar ${REPLY_MAX_LENGTH} caracteres.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await upsertReviewReply(review.id, comment);
      if (updated) onChange(updated);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible guardar la respuesta.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteReviewReply(review.id);
      onChange({ ...review, reply: null });
      setConfirmDelete(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible eliminar la respuesta.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    const length = text.trim().length;
    return (
      <div className="space-y-2 rounded-xl bg-[#f3f5ff] p-4">
        <label htmlFor={fieldId} className="text-xs font-bold text-[#514ddd]">
          {reply ? "Editar tu respuesta" : `Responder como ${establishmentName}`}
        </label>
        {reply?.comment_blocked && (
          <p className="text-xs text-amber-800">
            Tu respuesta anterior fue bloqueada por moderación. Un administrador revisará la nueva antes de publicarla.
          </p>
        )}
        <textarea
          id={fieldId}
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={REPLY_MAX_LENGTH}
          placeholder="Agradece la visita o explica qué harán para mejorar."
          aria-invalid={Boolean(error)}
          aria-describedby={`${fieldId}-help`}
          className="w-full resize-y rounded-xl border border-[#d7dcf2] bg-white px-3 py-2 text-sm outline-none focus:border-[#514ddd] focus:ring-2 focus:ring-[#514ddd]/20"
        />
        <div id={`${fieldId}-help`} className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-xs ${error ? "text-red-600" : "text-[#6d6e7a]"}`} role={error ? "alert" : undefined}>
            {error || "Tu respuesta es pública y el cliente recibe un aviso la primera vez que respondes."}
          </p>
          <span className="text-xs text-[#6d6e7a]">
            {length}/{REPLY_MAX_LENGTH}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="h-9 rounded-lg px-3 text-sm font-semibold text-[#43506a] hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || length === 0}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#514ddd] px-4 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-60"
          >
            {saving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {reply ? "Guardar cambios" : "Publicar respuesta"}
          </button>
        </div>
      </div>
    );
  }

  if (!reply) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={startEditing}
          className="flex items-center gap-2 rounded-lg bg-[#eef0ff] px-3 py-2 text-sm font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
        >
          <MessageSquareReply aria-hidden="true" className="size-4" />
          Responder
        </button>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-[#eef0ff] p-4 text-sm">
      <p className="text-xs font-bold text-[#514ddd]">
        Tu respuesta ·{" "}
        <time dateTime={reply.updated_at} title={formatDate(reply.updated_at)} className="font-medium text-[#6d6e7a]">
          {timeAgo(reply.updated_at)}
        </time>
      </p>
      {reply.comment_blocked ? (
        <>
          <BlockedContentNotice notice={reply.moderation_notice} />
          <p className="text-xs text-[#6d6e7a]">
            Los clientes ven este aviso en lugar de tu respuesta. Puedes reescribirla; un administrador la revisará antes de
            publicarla.
          </p>
        </>
      ) : (
        <p className="whitespace-pre-line text-[#43506a]">{reply.comment}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startEditing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#514ddd] hover:bg-white"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          {reply.comment_blocked ? "Reescribir" : "Editar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6d6e7a] hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Eliminar
        </button>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

      {confirmDelete && (
        <Modal title="Eliminar tu respuesta" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-[#43506a]">
            La reseña de {review.author.display_name} quedará sin respuesta. Podrás responder de nuevo cuando quieras.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-10 rounded-xl px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5fb]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={deleting}
              className="flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              Eliminar respuesta
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
