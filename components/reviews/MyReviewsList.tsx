"use client";

import { MessageSquare, Store } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import Modal from "@/components/ui/Modal";
import { deleteReview, listMyReviews, reviewErrorMessage, type MyReview } from "@/lib/reviews-api";
import ReviewCard from "./ReviewCard";

const PAGE_SIZE = 5;

// "Mis reseñas" del perfil: todas, incluidas las ocultas o bloqueadas por moderación con su motivo.
// Editar lleva al detalle del lugar (allí está el formulario); eliminar se hace aquí.
export default function MyReviewsList() {
  const [items, setItems] = useState<MyReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<MyReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async (skip: number) => {
    try {
      const page = await listMyReviews({ skip, limit: PAGE_SIZE });
      const pageItems = page?.items ?? [];
      setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
      setTotal(page?.total ?? 0);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tus reseñas.");
      setItems((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(() => load(0));
  }, [load]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    await load(items?.length ?? 0);
    setIsLoadingMore(false);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await deleteReview(toDelete.id);
      setItems((current) => current?.filter((item) => item.id !== toDelete.id) ?? null);
      setTotal((value) => Math.max(0, value - 1));
      setToDelete(null);
    } catch (deleteError) {
      setError(reviewErrorMessage(deleteError, "No fue posible eliminar la reseña."));
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (items === null) {
    return <div aria-busy="true" className="h-32 animate-pulse rounded-2xl bg-[#eef0ff]" />;
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {items.length === 0 && !error ? (
        <EmptyState
          icon={MessageSquare}
          title="Aún no has escrito reseñas"
          description="Cuando visites un lugar, cuéntale a la comunidad cómo te fue."
          action={
            <Link href="/explore" className="rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4542ca]">
              Explorar lugares
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((review) => (
            <li key={review.id} className="space-y-2">
              <Link
                href={`/establishments/${review.establishment.id}`}
                className="flex items-center gap-2 text-sm font-bold text-[#26344d] hover:text-[#514ddd]"
              >
                {review.establishment.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                  <img src={review.establishment.profile_image_url} alt="" className="size-7 rounded-lg object-cover" />
                ) : (
                  <Store aria-hidden="true" className="size-5 text-[#514ddd]" />
                )}
                {review.establishment.name}
              </Link>
              <ReviewCard
                as="div"
                own
                review={review}
                establishmentName={review.establishment.name}
                onDelete={() => setToDelete(review)}
                actions={
                  review.status !== "HIDDEN" && (
                    <Link
                      href={`/establishments/${review.establishment.id}#reviews`}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#514ddd] hover:bg-[#f3f5ff]"
                    >
                      Editar en el lugar
                    </Link>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={isLoadingMore} onLoadMore={() => void loadMore()} label="Ver más reseñas" />

      {toDelete && (
        <Modal title="Eliminar reseña" onClose={() => setToDelete(null)}>
          <p className="text-sm text-[#43506a]">
            Se borrará tu reseña de {toDelete.establishment.name} con sus fotos. Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setToDelete(null)} className="h-10 rounded-xl px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5fb]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
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
