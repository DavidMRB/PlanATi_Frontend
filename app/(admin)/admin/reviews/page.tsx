"use client";

import { MessageSquare, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import ModerationHelp from "@/components/admin/ModerationHelp";
import ModerationReviewCard from "@/components/admin/ModerationReviewCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { announceAdminCountsChanged, listAdminReviews, type AdminReview, type AdminReviewFilters } from "@/lib/admin-api";

const PAGE_SIZE = 20;

// Vistas rápidas de la cola de moderación.
const QUEUES = [
  { value: "all", label: "Todas" },
  { value: "flagged", label: "Pendientes de revisión" },
  { value: "reported", label: "Con reportes" },
  { value: "blocked", label: "Comentario bloqueado" },
  { value: "hidden", label: "Ocultas" },
] as const;

type Queue = (typeof QUEUES)[number]["value"];

const select =
  "h-10 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

function queueFilters(queue: Queue): AdminReviewFilters {
  switch (queue) {
    case "flagged":
      return { flagged_for_review: true };
    case "reported":
      return { has_reports: true };
    case "blocked":
      return { comment_status: "BLOCKED" };
    case "hidden":
      return { status: "HIDDEN" };
    default:
      return {};
  }
}

function toId(value: string | null): number | undefined {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : undefined;
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[#e9edff]" />}>
      <ReviewsModeration />
    </Suspense>
  );
}

// Filtros en la URL (?queue=&rating=&sort=&search=&establishment_id=&user_id=): los enlaces desde el detalle de
// un local o de un usuario llegan ya filtrados.
function ReviewsModeration() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queue = (QUEUES.some((item) => item.value === params.get("queue")) ? params.get("queue") : "all") as Queue;
  const rating = toId(params.get("rating"));
  const sort = params.get("sort") === "most_reported" ? "most_reported" : "recent";
  const search = params.get("search") ?? "";
  const establishmentId = toId(params.get("establishment_id"));
  const userId = toId(params.get("user_id"));
  const [searchInput, setSearchInput] = useState(search);

  const update = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "" || value === "all" || value === "recent") next.delete(key);
      else next.set(key, String(value));
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update({ search: searchInput.trim() });
  };

  const filters: AdminReviewFilters = {
    ...queueFilters(queue),
    rating,
    sort,
    search: search || undefined,
    establishment_id: establishmentId,
    user_id: userId,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Moderación de reseñas</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">
          Ves siempre el texto original, aunque el comentario esté bloqueado. Las acciones quedan en la bitácora y avisan al
          autor.
        </p>
      </header>

      <ModerationHelp />

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5">
        <div role="group" aria-label="Cola" className="flex gap-2 overflow-x-auto pb-1">
          {QUEUES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={queue === item.value}
              onClick={() => update({ queue: item.value })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                queue === item.value ? "bg-[#514ddd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <form onSubmit={handleSearch} role="search" className="flex h-10 flex-1 items-center gap-3 rounded-xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
            <Search aria-hidden="true" className="size-4 text-[#81869a]" />
            <label htmlFor="admin-review-search" className="sr-only">
              Buscar en el texto
            </label>
            <input
              id="admin-review-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar en el texto del comentario"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
            />
          </form>
          <div className="flex gap-3">
            <label className="sr-only" htmlFor="admin-review-rating">
              Estrellas
            </label>
            <select id="admin-review-rating" value={rating ?? ""} onChange={(event) => update({ rating: event.target.value || undefined })} className={select}>
              <option value="">Todas las estrellas</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} ★
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="admin-review-sort">
              Orden
            </label>
            <select id="admin-review-sort" value={sort} onChange={(event) => update({ sort: event.target.value })} className={select}>
              <option value="recent">Más recientes</option>
              <option value="most_reported">Más reportadas</option>
            </select>
          </div>
        </div>
        {(establishmentId || userId) && (
          <div className="flex flex-wrap gap-2">
            {establishmentId && (
              <button
                type="button"
                onClick={() => update({ establishment_id: undefined })}
                className="flex items-center gap-1 rounded-full bg-[#4c4cdd] px-3 py-1 text-xs font-semibold text-white"
              >
                Establecimiento #{establishmentId}
                <X aria-hidden="true" className="size-3.5" />
                <span className="sr-only">Quitar filtro</span>
              </button>
            )}
            {userId && (
              <button
                type="button"
                onClick={() => update({ user_id: undefined })}
                className="flex items-center gap-1 rounded-full bg-[#4c4cdd] px-3 py-1 text-xs font-semibold text-white"
              >
                Usuario #{userId}
                <X aria-hidden="true" className="size-3.5" />
                <span className="sr-only">Quitar filtro</span>
              </button>
            )}
          </div>
        )}
      </div>

      <ReviewPages key={JSON.stringify(filters)} filters={filters} queue={queue} />
    </div>
  );
}

function ReviewPages({ filters, queue }: { filters: AdminReviewFilters; queue: Queue }) {
  const [items, setItems] = useState<AdminReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listAdminReviews({ ...(JSON.parse(filtersKey) as AdminReviewFilters), skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las reseñas.");
        setItems((current) => current ?? []);
      }
    },
    [filtersKey],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  if (items === null) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map((key) => (
          <div key={key} className="h-48 animate-pulse rounded-2xl bg-[#e9edff]" />
        ))}
      </div>
    );
  }

  // Las tarjetas se actualizan en su sitio aunque dejen de cumplir el filtro (no saltan al moderar).
  const onChange = (reviewId: number, updated: AdminReview | null, text: string) => {
    setMessage(text);
    setItems((current) =>
      current ? (updated ? current.map((item) => (item.id === reviewId ? updated : item)) : current.filter((item) => item.id !== reviewId)) : current,
    );
    if (!updated) setTotal((value) => Math.max(0, value - 1));
    announceAdminCountsChanged();
  };

  const loadMore = async () => {
    setLoadingMore(true);
    await load(items.length);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className="rounded-2xl bg-[#c6f7f0] px-5 py-3 text-sm font-semibold text-[#0b6b5c]">
          {message}
        </p>
      )}
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {items.length === 0 && !error ? (
        <EmptyState
          icon={MessageSquare}
          title={queue === "flagged" ? "No hay comentarios reescritos pendientes de revisión" : "No hay reseñas con esos filtros"}
          description={queue === "flagged" ? "Cuando un autor reescriba un comentario bloqueado, aparecerá aquí." : undefined}
        />
      ) : (
        <ul className="space-y-4">
          {items.map((review) => (
            <ModerationReviewCard key={review.id} review={review} onChange={(updated, text) => onChange(review.id, updated, text)} />
          ))}
        </ul>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={loadingMore} onLoadMore={() => void loadMore()} label="Ver más reseñas" />
    </div>
  );
}
