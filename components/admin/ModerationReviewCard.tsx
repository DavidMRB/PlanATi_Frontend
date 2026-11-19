"use client";

import { Ban, CheckCircle2, Eye, EyeOff, Flag, ShieldAlert, ShieldCheck, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import StarRating from "@/components/reviews/StarRating";
import Avatar from "@/components/ui/Avatar";
import {
  blockReply,
  blockReviewComment,
  deleteReviewAsAdmin,
  deleteReviewImage,
  hideReview,
  restoreReview,
  unblockReply,
  unblockReviewComment,
  type AdminReview,
} from "@/lib/admin-api";
import { formatDate, timeAgo } from "@/lib/datetime";
import { COMMENT_STATUS_LABEL, REVIEW_STATUS_LABEL } from "@/lib/format";
import { MODERATION_CATEGORY_LABEL } from "@/lib/reviews-api";
import ConfirmWithReasonModal from "./ConfirmWithReasonModal";
import ModerationActionModal, { type ModerationKind } from "./ModerationActionModal";

type Dialog =
  | { kind: ModerationKind }
  | { kind: "unblock-comment" | "restore" | "delete" | "unblock-reply" }
  | { kind: "delete-image"; imageId: number };

type ModerationReviewCardProps = {
  review: AdminReview;
  // Reseña tras la acción, o null si se eliminó.
  onChange: (review: AdminReview | null, message: string) => void;
  as?: "li" | "div";
};

const button = "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50";

function categoryLabel(value: string | null) {
  return value ? (MODERATION_CATEGORY_LABEL[value] ?? value) : null;
}

// Reseña vista por el admin: texto original siempre visible, estados de moderación, autor, local, reportes y
// acciones en el orden del plan (bloquear/desbloquear comentario, ocultar/restaurar, eliminar, quitar imagen y
// lo mismo para la respuesta del establecimiento).
export default function ModerationReviewCard({ review, onChange, as = "li" }: ModerationReviewCardProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const Tag = as;
  const hidden = review.status === "HIDDEN";
  const blocked = review.comment_status === "BLOCKED";
  const reply = review.reply;
  const replyBlocked = reply?.comment_status === "BLOCKED";

  const done = (updated: AdminReview | null | undefined, message: string) => {
    setDialog(null);
    onChange(updated ?? null, message);
  };

  return (
    <Tag
      id={`admin-review-${review.id}`}
      className={`space-y-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)] ${
        review.flagged_for_review || reply?.flagged_for_review ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={{ full_name: review.author.full_name, picture: review.author.picture }} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              <Link href={`/admin/users/${review.author.id}`} className="hover:underline">
                {review.author.full_name}
              </Link>
              <span className="font-normal text-[#6d6e7a]"> · {review.author.display_name}</span>
              {review.author.status === "SUSPENDED" && (
                <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">Suspendido</span>
              )}
            </p>
            <p className="truncate text-xs text-[#6d6e7a]">
              {review.author.email} · en{" "}
              <Link href={`/admin/establishments/${review.establishment.id}`} className="font-semibold text-[#514ddd] hover:underline">
                {review.establishment.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating value={review.rating} />
          <time dateTime={review.created_at} title={formatDate(review.created_at)} className="text-xs text-[#6d6e7a]">
            {timeAgo(review.created_at)}
            {review.edited_at ? " · editada" : ""}
          </time>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className={`rounded-full px-2.5 py-1 ${hidden ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
          Reseña {REVIEW_STATUS_LABEL[review.status]?.toLowerCase() ?? review.status}
        </span>
        {review.comment !== null && (
          <span className={`rounded-full px-2.5 py-1 ${blocked ? "bg-red-100 text-red-700" : "bg-[#eef0ff] text-[#514ddd]"}`}>
            Comentario {COMMENT_STATUS_LABEL[review.comment_status]?.toLowerCase() ?? review.comment_status}
          </span>
        )}
        {review.flagged_for_review && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Reescrito tras el bloqueo · pendiente de revisión</span>
        )}
        {review.open_reports_count > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[#fde0e3] px-2.5 py-1 text-[#a30f35]">
            <Flag aria-hidden="true" className="size-3" />
            {review.open_reports_count} {review.open_reports_count === 1 ? "reporte abierto" : "reportes abiertos"}
          </span>
        )}
      </div>

      {(hidden || blocked) && (review.moderation_category || review.moderation_reason) && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          {categoryLabel(review.moderation_category) && <span className="font-bold">{categoryLabel(review.moderation_category)}. </span>}
          {review.moderation_reason}
        </p>
      )}

      {review.comment ? (
        <blockquote className={`whitespace-pre-line rounded-xl border-l-4 px-4 py-3 text-sm leading-7 ${blocked ? "border-red-300 bg-red-50/40" : "border-[#d7dcf2] bg-[#f8f9ff]"}`}>
          {review.comment}
        </blockquote>
      ) : (
        <p className="text-sm italic text-[#9295a4]">Sin comentario, solo estrellas.</p>
      )}

      {review.images.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Fotos de la reseña">
          {review.images.map((image) => (
            <li key={image.id} className="relative">
              <a href={image.image_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
                <img src={image.image_url} alt="Foto de la reseña" className="size-20 object-cover" />
              </a>
              <button
                type="button"
                onClick={() => setDialog({ kind: "delete-image", imageId: image.id })}
                aria-label="Quitar esta imagen"
                className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[#f0f2f8] pt-3">
        {review.comment !== null &&
          (blocked ? (
            <>
              <button type="button" onClick={() => setDialog({ kind: "unblock-comment" })} className={`${button} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                <ShieldCheck aria-hidden="true" className="size-4" />
                {review.flagged_for_review ? "Aprobar y publicar" : "Desbloquear comentario"}
              </button>
              {review.flagged_for_review && (
                <button type="button" onClick={() => setDialog({ kind: "block-comment" })} className={`${button} bg-red-50 text-red-700 hover:bg-red-100`}>
                  <Ban aria-hidden="true" className="size-4" />
                  Mantener bloqueado
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={() => setDialog({ kind: "block-comment" })} className={`${button} bg-red-50 text-red-700 hover:bg-red-100`}>
              <ShieldAlert aria-hidden="true" className="size-4" />
              Bloquear comentario
            </button>
          ))}
        {hidden ? (
          <button type="button" onClick={() => setDialog({ kind: "restore" })} className={`${button} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
            <Eye aria-hidden="true" className="size-4" />
            Restaurar reseña
          </button>
        ) : (
          <button type="button" onClick={() => setDialog({ kind: "hide" })} className={`${button} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
            <EyeOff aria-hidden="true" className="size-4" />
            Ocultar reseña
          </button>
        )}
        <button type="button" onClick={() => setDialog({ kind: "delete" })} className={`${button} text-[#6d6e7a] hover:bg-red-50 hover:text-red-700`}>
          <Trash2 aria-hidden="true" className="size-4" />
          Eliminar
        </button>
      </div>

      {reply && (
        <div className={`space-y-2 rounded-xl p-4 text-sm ${replyBlocked ? "bg-red-50/60" : "bg-[#eef0ff]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-[#514ddd]">
              Respuesta de {review.establishment.name}
              <span className="ml-2 font-medium text-[#6d6e7a]">{timeAgo(reply.updated_at)}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              {replyBlocked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Bloqueada</span>}
              {reply.flagged_for_review && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Reescrita · pendiente de revisión</span>
              )}
            </div>
          </div>
          <p className="whitespace-pre-line text-[#43506a]">{reply.comment}</p>
          {replyBlocked && (reply.moderation_category || reply.moderation_reason) && (
            <p className="text-xs text-amber-900">
              {categoryLabel(reply.moderation_category) && <span className="font-bold">{categoryLabel(reply.moderation_category)}. </span>}
              {reply.moderation_reason}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {replyBlocked ? (
              <>
                <button type="button" onClick={() => setDialog({ kind: "unblock-reply" })} className={`${button} bg-white text-emerald-700 hover:bg-emerald-50`}>
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  {reply.flagged_for_review ? "Aprobar y publicar" : "Desbloquear respuesta"}
                </button>
                {reply.flagged_for_review && (
                  <button type="button" onClick={() => setDialog({ kind: "block-reply" })} className={`${button} bg-white text-red-700 hover:bg-red-50`}>
                    <Ban aria-hidden="true" className="size-4" />
                    Mantener bloqueada
                  </button>
                )}
              </>
            ) : (
              <button type="button" onClick={() => setDialog({ kind: "block-reply" })} className={`${button} bg-white text-red-700 hover:bg-red-50`}>
                <ShieldAlert aria-hidden="true" className="size-4" />
                Bloquear respuesta
              </button>
            )}
          </div>
        </div>
      )}

      {dialog?.kind === "block-comment" && (
        <ModerationActionModal
          kind="block-comment"
          hasImages={review.images.length > 0}
          onClose={() => setDialog(null)}
          onConfirm={async (decision) => done(await blockReviewComment(review.id, decision), "Comentario bloqueado.")}
        />
      )}
      {dialog?.kind === "hide" && (
        <ModerationActionModal
          kind="hide"
          onClose={() => setDialog(null)}
          onConfirm={async ({ category, note }) => done(await hideReview(review.id, { category, reason: note }), "Reseña oculta.")}
        />
      )}
      {dialog?.kind === "block-reply" && reply && (
        <ModerationActionModal
          kind="block-reply"
          onClose={() => setDialog(null)}
          onConfirm={async ({ category, note }) => done(await blockReply(reply.id, { category, note }), "Respuesta bloqueada.")}
        />
      )}
      {dialog?.kind === "unblock-comment" && (
        <ConfirmWithReasonModal
          title={review.flagged_for_review ? "Aprobar el comentario reescrito" : "Desbloquear comentario"}
          description="El comentario vuelve a verse en público y el autor recibe un aviso."
          confirmLabel={review.flagged_for_review ? "Aprobar y publicar" : "Desbloquear"}
          reasonLabel="Nota para el autor"
          required={false}
          tone="primary"
          onClose={() => setDialog(null)}
          onConfirm={async (note) => done(await unblockReviewComment(review.id, note), "Comentario publicado.")}
        />
      )}
      {dialog?.kind === "restore" && (
        <ConfirmWithReasonModal
          title="Restaurar reseña"
          description="La reseña vuelve a verse en público y cuenta otra vez en el promedio."
          confirmLabel="Restaurar"
          reasonLabel="Nota para el autor"
          required={false}
          tone="primary"
          onClose={() => setDialog(null)}
          onConfirm={async (note) => done(await restoreReview(review.id, note), "Reseña restaurada.")}
        />
      )}
      {dialog?.kind === "unblock-reply" && reply && (
        <ConfirmWithReasonModal
          title={reply.flagged_for_review ? "Aprobar la respuesta reescrita" : "Desbloquear respuesta"}
          description="La respuesta del establecimiento vuelve a verse en público."
          confirmLabel={reply.flagged_for_review ? "Aprobar y publicar" : "Desbloquear"}
          reasonLabel="Nota para el establecimiento"
          required={false}
          tone="primary"
          onClose={() => setDialog(null)}
          onConfirm={async (note) => done(await unblockReply(reply.id, note), "Respuesta publicada.")}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmWithReasonModal
          title="Eliminar reseña"
          description="Solo para contenido ilegal: la reseña se borra de la base de datos (queda una copia en la bitácora) y sale del promedio. No se puede deshacer."
          confirmLabel="Eliminar definitivamente"
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            await deleteReviewAsAdmin(review.id, reason);
            done(null, "Reseña eliminada.");
          }}
        />
      )}
      {dialog?.kind === "delete-image" && (
        <ConfirmWithReasonModal
          title="Quitar imagen"
          description="La foto se borra de la reseña y el autor recibe un aviso."
          confirmLabel="Quitar imagen"
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            const imageId = dialog.imageId;
            await deleteReviewImage(imageId, reason);
            done({ ...review, images: review.images.filter((image) => image.id !== imageId) }, "Imagen eliminada.");
          }}
        />
      )}
    </Tag>
  );
}
