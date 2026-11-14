"use client";

import { MessageSquare, MessageSquareReply, Percent } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReplyEditor from "@/components/reviews/ReplyEditor";
import { ReportButton } from "@/components/reviews/ReportDialog";
import ReviewCard from "@/components/reviews/ReviewCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import {
  getRestaurantProfile,
  getRestaurantReviewSummary,
  listRestaurantReviews,
  RESTAURANT_REVIEWS_CHANGED,
  type ReplyFilter,
  type RestaurantProfile,
  type RestaurantReviewSort,
  type RestaurantReviewSummary,
} from "@/lib/restaurant-api";
import type { Review } from "@/lib/reviews-api";

const PAGE_SIZE = 10;
const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

const TABS: Array<{ value: ReplyFilter; label: string }> = [
  { value: "unanswered", label: "Sin responder" },
  { value: "all", label: "Todas" },
  { value: "answered", label: "Respondidas" },
];

const SORTS: Array<{ value: RestaurantReviewSort; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "rating_asc", label: "Peor puntuación primero" },
];

function formatRate(rate: number | null | undefined): string {
  return rate == null ? "—" : `${Math.round(rate * 100)} %`;
}

// Reseñas del establecimiento (sección 7.4 del plan): resumen, pestañas por estado de respuesta,
// filtro por estrellas, orden y respuesta en línea.
export default function RestaurantReviewsPage() {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [summary, setSummary] = useState<RestaurantReviewSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [tab, setTab] = useState<ReplyFilter>("unanswered");
  const [sort, setSort] = useState<RestaurantReviewSort>("recent");
  const [rating, setRating] = useState<number | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setSummary((await getRestaurantReviewSummary()) ?? null);
      setSummaryError("");
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "No fue posible cargar el resumen.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSummary);
    getRestaurantProfile()
      .then((data) => setProfile(data ?? null))
      .catch(() => setProfile(null));
  }, [loadSummary]);

  const onReplyChanged = useCallback(() => {
    void loadSummary();
    window.dispatchEvent(new Event(RESTAURANT_REVIEWS_CHANGED));
  }, [loadSummary]);

  const establishmentName = profile?.name ?? "tu establecimiento";

  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-72 rounded-full bg-[#c9cdf4]/40 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Opiniones de tus clientes</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Reseñas y respuestas</h1>
          <p className="max-w-2xl text-base text-[#43506a]">
            Responder a tiempo muestra que te importa la experiencia de quien te visita. Tus respuestas son públicas y
            aparecen debajo de cada reseña.
          </p>
        </div>
      </header>

      {summaryError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{summaryError}</p>}

      {summary ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <RatingSummary
            average={summary.rating_avg}
            count={summary.rating_count}
            distribution={summary.distribution}
            categoryRank={summary.category_rank}
            category={profile?.category}
            selectedRating={rating}
            onSelectRating={setRating}
          />
          <div className="grid grid-cols-2 gap-4 lg:w-56 lg:grid-cols-1">
            <button
              type="button"
              onClick={() => setTab("unanswered")}
              className="rounded-2xl bg-white p-5 text-left shadow-[0_4px_16px_rgba(23,36,61,0.06)] transition hover:ring-2 hover:ring-[#c9cdf4]"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#fde0e3] text-[#d6154a]">
                <MessageSquareReply aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-3 text-3xl font-extrabold">{summary.unanswered_count}</p>
              <p className="text-sm font-bold">Sin responder</p>
            </button>
            <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#c6f7f0] text-[#0b6b5c]">
                <Percent aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-3 text-3xl font-extrabold">{formatRate(summary.response_rate)}</p>
              <p className="text-sm font-bold">Tasa de respuesta</p>
            </div>
          </div>
        </div>
      ) : (
        !summaryError && <div aria-busy="true" className="h-48 animate-pulse rounded-2xl bg-white" />
      )}

      <section aria-labelledby="restaurant-reviews-title" className="space-y-4">
        <h2 id="restaurant-reviews-title" className="sr-only">
          Lista de reseñas
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filtrar por respuesta" className="flex flex-wrap gap-1 rounded-full bg-[#eef0ff] p-1">
            {TABS.map((option) => {
              const active = tab === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(option.value)}
                  className={`h-8 rounded-full px-4 text-sm font-semibold transition ${
                    active ? "bg-[#514ddd] text-white shadow" : "text-[#26344d] hover:bg-white"
                  }`}
                >
                  {option.label}
                  {option.value === "unanswered" && summary && summary.unanswered_count > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 text-xs ${active ? "bg-white/25" : "bg-[#d6154a] text-white"}`}>
                      {summary.unanswered_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="sr-only" htmlFor="restaurant-review-sort">
            Ordenar reseñas
          </label>
          <select
            id="restaurant-review-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as RestaurantReviewSort)}
            className="h-10 rounded-xl bg-white px-3 text-sm font-semibold text-[#26344d] shadow-[0_2px_8px_rgba(23,36,61,0.06)] outline-none focus:ring-2 focus:ring-[#6868e8]/50"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {rating && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="h-9 rounded-full bg-[#4c4cdd] px-4 text-sm font-semibold text-white"
            >
              {rating} ★ · Quitar filtro
            </button>
          )}
        </div>

        <ReviewPages
          key={`${tab}-${sort}-${rating}`}
          tab={tab}
          sort={sort}
          rating={rating}
          establishmentName={establishmentName}
          onReplyChanged={onReplyChanged}
        />
      </section>
    </div>
  );
}

function ReviewPages({
  tab,
  sort,
  rating,
  establishmentName,
  onReplyChanged,
}: {
  tab: ReplyFilter;
  sort: RestaurantReviewSort;
  rating: number | null;
  establishmentName: string;
  onReplyChanged: () => void;
}) {
  const [items, setItems] = useState<Review[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listRestaurantReviews({ status: tab, sort, rating, skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) =>
          skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))],
        );
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las reseñas.");
        setItems((current) => current ?? []);
      }
    },
    [tab, sort, rating],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  // Las reseñas que se respondieron (o quedaron sin respuesta) aquí ya no cuentan en el servidor para esta
  // pestaña: se descuentan del desplazamiento y del conteo para no saltarse ninguna al cargar más.
  const moved =
    tab === "all" ? 0 : (items ?? []).filter((item) => (tab === "unanswered" ? item.reply !== null : item.reply === null)).length;
  const matching = (items?.length ?? 0) - moved;

  const loadMore = async () => {
    setIsLoadingMore(true);
    await load(matching);
    setIsLoadingMore(false);
  };

  // La reseña se actualiza en su sitio aunque deje de cumplir la pestaña (no salta de la lista al responder).
  const replace = (updated: Review) => {
    const before = items?.find((item) => item.id === updated.id);
    setItems((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? current);
    // El total del servidor cambia si la reseña entra o sale de la pestaña.
    if (tab !== "all" && before && (before.reply === null) !== (updated.reply === null)) {
      const leaves = tab === "unanswered" ? updated.reply !== null : updated.reply === null;
      setTotal((current) => current + (leaves ? -1 : 1));
    }
    onReplyChanged();
  };

  if (items === null) {
    return (
      <div aria-busy="true" className="space-y-4">
        {[0, 1].map((key) => (
          <div key={key} className="h-36 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {items.length === 0 && !error ? (
        <EmptyState
          icon={MessageSquare}
          title={
            rating
              ? "No hay reseñas con esas estrellas"
              : tab === "unanswered"
                ? "¡Estás al día! No tienes reseñas sin responder"
                : tab === "answered"
                  ? "Todavía no has respondido reseñas"
                  : "Aún no tienes reseñas"
          }
          description={
            rating
              ? "Prueba quitando el filtro."
              : tab === "all"
                ? "Cuando tus clientes opinen sobre tu local, las verás aquí."
                : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              establishmentName={establishmentName}
              replySlot={<ReplyEditor review={review} establishmentName={establishmentName} onChange={replace} />}
              actions={<ReportButton targetType="REVIEW" targetId={review.id} targetLabel="esta reseña" ownerId={review.author.id} />}
            />
          ))}
        </ul>
      )}
      <LoadMoreButton loaded={matching} total={total} isLoading={isLoadingMore} onLoadMore={() => void loadMore()} label="Ver más reseñas" />
    </div>
  );
}
