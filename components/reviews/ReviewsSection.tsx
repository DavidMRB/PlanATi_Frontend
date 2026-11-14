"use client";

import { LogIn, PenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { PublicEstablishmentDetail } from "@/lib/establishments-api";
import { deleteReview, reviewErrorMessage } from "@/lib/reviews-api";
import RatingSummary from "./RatingSummary";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm.tsx";
import ReviewList from "./ReviewList";

type ReviewsSectionProps = {
  detail: PublicEstablishmentDetail;
  // Recarga el detalle (promedio, distribución y campos viewer_*).
  onChanged: () => void | Promise<void>;
};

// Bloque de reseñas del detalle (sección 7.3 del plan): resumen, acción según viewer_*, la reseña propia,
// el formulario y la lista paginada. `?review=1` abre el formulario (invitación a reseñar tras un plan).
export default function ReviewsSection({ detail, onChanged }: ReviewsSectionProps) {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [autoFocusForm, setAutoFocusForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const own = detail.viewer_review;
  const block = detail.viewer_review_block;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("review") !== "1") return;
    void Promise.resolve().then(() => {
      if (detail.viewer_can_review) {
        setFormOpen(true);
        setAutoFocusForm(true);
      } else if (detail.viewer_review) {
        document.getElementById(`review-${detail.viewer_review.id}`)?.scrollIntoView({ block: "center" });
      }
    });
    // Solo al llegar a la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterChange = async (text: string) => {
    setFormOpen(false);
    setEditing(false);
    setError("");
    setMessage(text);
    await onChanged();
    setReloadKey((value) => value + 1);
  };

  const handleDelete = async () => {
    if (!own) return;
    setIsDeleting(true);
    try {
      await deleteReview(own.id);
      setConfirmDelete(false);
      await afterChange("Tu reseña fue eliminada.");
    } catch (deleteError) {
      setError(reviewErrorMessage(deleteError, "No fue posible eliminar tu reseña."));
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const redirect = encodeURIComponent(`/establishments/${detail.id}?review=1#reviews`);

  return (
    <div className="space-y-5">
      <RatingSummary
        average={detail.rating_avg ?? detail.average_rating}
        count={detail.rating_count ?? detail.reviews_count}
        distribution={detail.rating_distribution}
        categoryRank={detail.category_rank}
        category={detail.category}
        selectedRating={ratingFilter}
        onSelectRating={setRatingFilter}
      />

      {message && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Acción según quién consulta. Restaurante, admin y dueño no ven nada. */}
      {own ? (
        editing ? (
          <ReviewForm
            establishmentId={detail.id}
            establishmentName={detail.name}
            existing={own}
            autoFocus
            onSaved={() => void afterChange("Tu reseña fue actualizada.")}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <ReviewCard
            as="div"
            review={own}
            own
            establishmentName={detail.name}
            onEdit={() => setEditing(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        )
      ) : detail.viewer_can_review ? (
        formOpen ? (
          <ReviewForm
            establishmentId={detail.id}
            establishmentName={detail.name}
            autoFocus={autoFocusForm}
            onSaved={() => void afterChange("¡Gracias! Tu reseña fue publicada.")}
            onCancel={() => setFormOpen(false)}
            onConflict={() => void afterChange("Ya tenías una reseña en este lugar; aquí puedes editarla.")}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setFormOpen(true);
              setAutoFocusForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
          >
            <PenLine aria-hidden="true" className="size-4" />
            Escribir una reseña
          </button>
        )
      ) : block === "LOGIN_REQUIRED" ? (
        <Link
          href={`/login?redirect=${redirect}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#eef0ff] px-6 py-4 text-sm font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
        >
          <LogIn aria-hidden="true" className="size-4" />
          Inicia sesión para dejar tu reseña
        </Link>
      ) : block === "PHONE_NOT_VERIFIED" ? (
        <Link
          href="/complete-profile"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#eef0ff] px-6 py-4 text-sm font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Verifica tu teléfono para opinar
        </Link>
      ) : block === "SUSPENDED" ? (
        <p className="rounded-2xl bg-[#f1f2f6] px-4 py-3 text-sm text-[#5b6175]">Tu cuenta está suspendida y no puede publicar reseñas.</p>
      ) : null}

      <ReviewList
        establishmentId={detail.id}
        establishmentName={detail.name}
        rating={ratingFilter}
        onClearRating={() => setRatingFilter(null)}
        excludeId={own?.id}
        reloadKey={reloadKey}
      />

      {confirmDelete && (
        <Modal title="Eliminar tu reseña" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-[#43506a]">
            Se borrarán tus estrellas, tu comentario y tus fotos de {detail.name}. Esta acción no se puede deshacer.
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
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
