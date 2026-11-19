import { EyeOff, ShieldAlert } from "lucide-react";
import { MODERATION_CATEGORY_LABEL, type MyReview } from "@/lib/reviews-api";

// Aviso solo para el autor cuando su reseña fue ocultada o su comentario bloqueado. Muestra la categoría y
// la nota del administrador; el texto original solo lo ve él.
export default function MyBlockedReviewBanner({ review }: { review: MyReview }) {
  const hidden = review.status === "HIDDEN";
  const blocked = review.comment_status === "BLOCKED";
  if (!hidden && !blocked) return null;

  const category = review.moderation_category
    ? (MODERATION_CATEGORY_LABEL[review.moderation_category] ?? review.moderation_category)
    : null;

  return (
    <div role="status" className="space-y-1.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-bold">
        {hidden ? <EyeOff aria-hidden="true" className="size-4" /> : <ShieldAlert aria-hidden="true" className="size-4" />}
        {hidden ? "Tu reseña fue ocultada por moderación" : "Tu comentario fue bloqueado"}
        {category ? ` por: ${category}.` : "."}
      </p>
      {review.moderation_reason && <p>Nota del administrador: {review.moderation_reason}</p>}
      {hidden ? (
        <p className="text-xs">No se muestra al público ni cuenta en el promedio, y no puede editarse.</p>
      ) : review.flagged_for_review ? (
        <p className="text-xs">Un administrador revisará tu nuevo comentario antes de publicarlo.</p>
      ) : (
        <p className="text-xs">
          Tus estrellas siguen contando. Solo tú ves el texto original; si lo reescribes, un administrador lo revisará antes
          de publicarlo.
        </p>
      )}
    </div>
  );
}
