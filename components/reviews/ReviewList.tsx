"use client";

import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listEstablishmentReviews, type Review, type ReviewSort } from "@/lib/reviews-api";
import { ReportButton } from "./ReportDialog";
import ReviewCard from "./ReviewCard";

const PAGE_SIZE = 10;

const SORTS: Array<{ value: ReviewSort; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "rating_desc", label: "Mejor puntuación" },
  { value: "rating_asc", label: "Peor puntuación" },
];

type ReviewListProps = {
  establishmentId: number;
  establishmentName: string;
  // Filtro por estrellas (lo controla RatingSummary); null = todas.
  rating: number | null;
  onClearRating: () => void;
  // La reseña propia se muestra aparte, arriba.
  excludeId?: number | null;
  // Cambia tras publicar, editar o borrar para recargar la primera página.
  reloadKey: number;
};

// Reseñas paginadas ("Cargar más") con orden y filtros (estrellas, "Con fotos").
export default function ReviewList(props: ReviewListProps) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [withPhotos, setWithPhotos] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="review-sort">
          Ordenar reseñas
        </label>
        <select
          id="review-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as ReviewSort)}
          className="h-9 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={withPhotos}
          onClick={() => setWithPhotos((value) => !value)}
          className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
            withPhotos ? "bg-[#4c4cdd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
          }`}
        >
          Con fotos
        </button>
        {props.rating && (
          <button
            type="button"
            onClick={props.onClearRating}
            className="h-9 rounded-full bg-[#4c4cdd] px-4 text-sm font-semibold text-white"
          >
            {props.rating} ★ · Quitar filtro
          </button>
        )}
      </div>
      <ReviewPages key={`${sort}-${withPhotos}-${props.rating}-${props.reloadKey}`} {...props} sort={sort} withPhotos={withPhotos} />
    </div>
  );
}

function ReviewPages({
  establishmentId,
  establishmentName,
  rating,
  excludeId,
  sort,
  withPhotos,
}: ReviewListProps & { sort: ReviewSort; withPhotos: boolean }) {
  const [items, setItems] = useState<Review[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listEstablishmentReviews(establishmentId, { sort, rating, withPhotos, skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
        setLoaded((current) => (skip === 0 ? pageItems.length : current + pageItems.length));
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las reseñas.");
        setItems((current) => current ?? []);
      }
    },
    [establishmentId, sort, rating, withPhotos],
  );

  useEffect(() => {
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(() => load(0));
  }, [load]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    await load(loaded);
    setIsLoadingMore(false);
  };

  if (items === null) {
    return (
      <div aria-busy="true" className="space-y-4">
        {[0, 1].map((key) => (
          <div key={key} className="h-32 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  const visible = items.filter((item) => item.id !== excludeId);

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {visible.length === 0 && !error ? (
        <EmptyState
          icon={MessageSquare}
          title={rating || withPhotos ? "No hay reseñas con esos filtros" : "Este lugar aún no tiene otras reseñas"}
          description={rating || withPhotos ? "Prueba quitando los filtros." : undefined}
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              establishmentName={establishmentName}
              actions={<ReportButton targetType="REVIEW" targetId={review.id} targetLabel="esta reseña" ownerId={review.author.id} />}
              replyActions={
                review.reply && !review.reply.comment_blocked ? (
                  <ReportButton targetType="REVIEW_REPLY" targetId={review.reply.id} targetLabel="esta respuesta" />
                ) : undefined
              }
            />
          ))}
        </ul>
      )}
      <LoadMoreButton loaded={loaded} total={total} isLoading={isLoadingMore} onLoadMore={() => void loadMore()} label="Ver más reseñas" />
    </div>
  );
}
