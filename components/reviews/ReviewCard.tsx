"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import Avatar from "@/components/ui/Avatar";
import { formatDate, timeAgo } from "@/lib/datetime";
import type { MyReview, Review } from "@/lib/reviews-api";
import BlockedContentNotice from "./BlockedContentNotice";
import ImageLightbox from "./ImageLightbox";
import MyBlockedReviewBanner from "./MyBlockedReviewBanner";
import StarRating from "./StarRating";

type ReviewCardProps = {
  review: Review | MyReview;
  establishmentName: string;
  // Reseña propia: muestra el texto original (aunque esté bloqueado), el aviso de moderación y las acciones.
  own?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  // Acciones extra (p. ej. "Reportar" en F5).
  actions?: ReactNode;
  // Sustituye el bloque de la respuesta del establecimiento (el panel del restaurante pone su ReplyEditor).
  replySlot?: ReactNode;
  // Acciones bajo la respuesta del establecimiento (p. ej. "Reportar").
  replyActions?: ReactNode;
  as?: "li" | "div";
};

function isMyReview(review: Review | MyReview): review is MyReview {
  return "comment_status" in review;
}

export default function ReviewCard({
  review,
  establishmentName,
  own = false,
  onEdit,
  onDelete,
  actions,
  replySlot,
  replyActions,
  as = "li",
}: ReviewCardProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const Tag = as;
  const mine = own && isMyReview(review) ? review : null;
  const hidden = review.status === "HIDDEN";

  return (
    <Tag
      id={`review-${review.id}`}
      className={`scroll-mt-24 space-y-3 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)] ${
        own ? "ring-2 ring-[#c9cdf4]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={{ full_name: review.author.display_name, picture: review.author.picture }} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {review.author.display_name}
              {own && <span className="ml-2 rounded-md bg-[#eef0ff] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#514ddd]">Tu reseña</span>}
            </p>
            <p className="text-xs text-[#6d6e7a]">
              <time dateTime={review.created_at} title={formatDate(review.created_at)}>
                {timeAgo(review.created_at)}
              </time>
              {review.edited_at && <span title={`Editada el ${formatDate(review.edited_at)}`}> · (editada)</span>}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} />
      </div>

      {mine && <MyBlockedReviewBanner review={mine} />}

      {mine ? (
        review.comment && <p className="whitespace-pre-line text-sm leading-7 text-[#43506a]">{review.comment}</p>
      ) : review.comment_blocked ? (
        <BlockedContentNotice notice={review.moderation_notice} />
      ) : (
        review.comment && <p className="whitespace-pre-line text-sm leading-7 text-[#43506a]">{review.comment}</p>
      )}

      {review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {review.images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setLightbox(index)}
              aria-label={`Ver foto ${index + 1} de la reseña de ${review.author.display_name}`}
              className="shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-[#514ddd]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
              <img src={image.image_url} alt="" loading="lazy" className="size-20 object-cover" />
            </button>
          ))}
        </div>
      )}

      {replySlot !== undefined ? replySlot : review.reply && (
        <div className="space-y-1 rounded-xl bg-[#eef0ff] p-4 text-sm">
          <p className="text-xs font-bold text-[#514ddd]">Respuesta de {establishmentName}</p>
          {review.reply.comment_blocked ? (
            <BlockedContentNotice notice={review.reply.moderation_notice} />
          ) : (
            <p className="whitespace-pre-line text-[#43506a]">{review.reply.comment}</p>
          )}
          {replyActions && <div className="flex justify-end">{replyActions}</div>}
        </div>
      )}

      {(own && (onEdit || onDelete)) || actions ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {own && onEdit && !hidden && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#514ddd] hover:bg-[#f3f5ff]"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              Editar
            </button>
          )}
          {own && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6d6e7a] hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Eliminar
            </button>
          )}
          {actions}
        </div>
      ) : null}

      {lightbox !== null && (
        <ImageLightbox
          images={review.images}
          startIndex={lightbox}
          title={`Fotos de ${review.author.display_name}`}
          onClose={() => setLightbox(null)}
        />
      )}
    </Tag>
  );
}
