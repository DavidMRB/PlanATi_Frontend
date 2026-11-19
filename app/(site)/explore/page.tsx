"use client";

import { List, Loader2, LocateFixed, Map as MapIcon, MapPin, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { EstablishmentsMap } from "@/components/map/lazy";
import LocationPurposeNote from "@/components/privacy/LocationPurposeNote";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { useGeolocation, type GeoPosition } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  ESTABLISHMENT_CATEGORIES,
  ESTABLISHMENT_TYPE_KEYS,
  ESTABLISHMENT_TYPES,
  establishmentTypeLabel,
  formatRating,
  isEstablishmentType,
  searchEstablishments,
  searchNearbyEstablishments,
  type DirectorySort,
  type MapMarker,
  type NearbySort,
  type PublicEstablishment,
} from "@/lib/establishments-api";
import { formatDistance, haversineKm, toLatLng } from "@/lib/geo";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;
const NEARBY_LIMIT = 50;
const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
const DEFAULT_RADIUS = 5;

const DIRECTORY_SORTS: Array<{ value: DirectorySort; label: string }> = [
  { value: "ranking", label: "Mejor posicionados" },
  { value: "rating", label: "Mejor puntuados" },
  { value: "reviews", label: "Más reseñas" },
  { value: "recent", label: "Más recientes" },
];
const NEARBY_SORTS: Array<{ value: NearbySort; label: string }> = [
  { value: "distance", label: "Más cercanos" },
  { value: "relevance", label: "Relevancia" },
  { value: "rating", label: "Mejor puntuados" },
];
const MIN_RATING_OPTIONS = [
  { value: 0, label: "Cualquier puntuación" },
  { value: 3, label: "3 ★ o más" },
  { value: 4, label: "4 ★ o más" },
  { value: 4.5, label: "4,5 ★ o más" },
];

const chipClass = (active: boolean) =>
  `flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-[#4c4cdd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
  }`;
const selectClass =
  "h-10 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

type ExploreQuery = {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  near?: string;
  radius?: string;
  min?: string;
  view?: string;
};

type ExploreParams = {
  search: string;
  category: string;
  // Tipo de establecimiento (RESTAURANT, HOTEL…) o "" para todos.
  type: string;
  sort: string;
  near: boolean;
  radius: number;
  minRating: number;
  view: "list" | "map";
};

function parseParams(query: ExploreQuery): ExploreParams {
  const radius = Number(query.radius);
  const minRating = Number(query.min);
  return {
    search: (query.search ?? "").trim(),
    category: query.category ?? "",
    type: isEstablishmentType(query.type) ? query.type : "",
    sort: query.sort ?? "",
    near: query.near === "1",
    radius: (RADIUS_OPTIONS as readonly number[]).includes(radius) ? radius : DEFAULT_RADIUS,
    minRating: MIN_RATING_OPTIONS.some((option) => option.value === minRating) ? minRating : 0,
    view: query.view === "map" ? "map" : "list",
  };
}

function toQueryString(params: ExploreParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.sort) query.set("sort", params.sort);
  if (params.near) query.set("near", "1");
  if (params.near && params.radius !== DEFAULT_RADIUS) query.set("radius", String(params.radius));
  if (params.minRating) query.set("min", String(params.minRating));
  if (params.view === "map") query.set("view", "map");
  const serialized = query.toString();
  return serialized ? `/explore?${serialized}` : "/explore";
}

// Búsqueda sin tildes ni mayúsculas (para filtrar en el cliente los cercanos, que no aceptan texto).
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type ListItem = PublicEstablishment & { distance_km?: number };

// Estado en la URL (?search, ?category, ?type, ?sort, ?near=1, ?radius, ?min, ?view=map) para compartir y para el
// botón "atrás". La vista no se remonta al cambiar los parámetros: así el mapa no se vuelve a crear.
export default function ExplorePage({ searchParams }: { searchParams: Promise<ExploreQuery> }) {
  const query = use(searchParams);
  return <ExploreView params={parseParams(query)} />;
}

function ExploreView({ params }: { params: ExploreParams }) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const geo = useGeolocation({ mode: "nearby" });

  const navigate = useCallback(
    (patch: Partial<ExploreParams>, { replace = false } = {}) => {
      const url = toQueryString({ ...params, ...patch });
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [params, router],
  );

  // El texto del buscador es local y se escribe en la URL tras una pausa. Si la URL cambia desde fuera
  // (buscador del Navbar), el texto se actualiza, salvo que sea el que se acaba de escribir.
  const [searchInput, setSearchInput] = useState(params.search);
  const [seenSearch, setSeenSearch] = useState(params.search);
  const [writtenSearch, setWrittenSearch] = useState<string | null>(null);
  if (params.search !== seenSearch) {
    setSeenSearch(params.search);
    if (params.search !== writtenSearch) setSearchInput(params.search);
  }
  useEffect(() => {
    const term = searchInput.trim();
    if (term === params.search) return;
    const timer = window.setTimeout(() => {
      setWrittenSearch(term);
      navigate({ search: term }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, params.search, navigate]);

  const position: GeoPosition | null = geo.position;
  const nearActive = params.near && position !== null;
  const sorts = nearActive ? NEARBY_SORTS : DIRECTORY_SORTS;
  const sort = sorts.some((option) => option.value === params.sort) ? params.sort : sorts[0].value;

  // --- Lista ------------------------------------------------------------------------------------
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const lat = position?.lat;
  const lng = position?.lng;
  const loadKey = JSON.stringify([nearActive, params.search, params.category, params.type, sort, params.minRating, params.radius, nearActive ? lat : null, nearActive ? lng : null]);

  useEffect(() => {
    const controller = new AbortController();
    const filters = {
      category: params.category || undefined,
      establishmentType: params.type || undefined,
      minRating: params.minRating || undefined,
    };
    const request =
      nearActive && lat !== undefined && lng !== undefined
        ? searchNearbyEstablishments(
            { ...filters, latitude: lat, longitude: lng, radiusKm: params.radius, limit: NEARBY_LIMIT, sort: sort as NearbySort },
            { signal: controller.signal },
          ).then((data) => {
            const term = normalize(params.search);
            const list = (data ?? []).filter(
              (item) => !term || normalize(`${item.name} ${item.address} ${item.category}`).includes(term),
            );
            return { list: list as ListItem[], more: false };
          })
        : searchEstablishments(
            { ...filters, search: params.search || undefined, sort: sort as DirectorySort, limit: PAGE_SIZE },
            { signal: controller.signal },
          ).then((data) => ({ list: (data ?? []) as ListItem[], more: (data?.length ?? 0) === PAGE_SIZE }));

    request
      .then(({ list, more }) => {
        if (controller.signal.aborted) return;
        setItems(list);
        setHasMore(more);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el directorio.");
        setItems((current) => current ?? []);
      });
    return () => controller.abort();
    // loadKey resume todas las dependencias de la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  const loadMore = async () => {
    if (!items) return;
    setIsLoadingMore(true);
    try {
      const data =
        (await searchEstablishments({
          search: params.search || undefined,
          category: params.category || undefined,
          establishmentType: params.type || undefined,
          minRating: params.minRating || undefined,
          sort: sort as DirectorySort,
          skip: items.length,
          limit: PAGE_SIZE,
        })) ?? [];
      setItems((current) => [...(current ?? []), ...data.filter((item) => !current?.some((known) => known.id === item.id))]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar más lugares.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const distanceOf = (item: ListItem): number | null => {
    if (typeof item.distance_km === "number") return item.distance_km;
    const point = toLatLng(item.latitude, item.longitude);
    return position && point ? haversineKm(position, point) : null;
  };

  // --- Mapa ↔ lista -----------------------------------------------------------------------------
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());

  useEffect(() => {
    if (!selected || !isDesktop) return;
    cardRefs.current.get(selected.id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, isDesktop]);

  const showMap = isDesktop || params.view === "map";
  const mapFilters = useMemo(
    () => ({
      category: params.category || undefined,
      establishmentType: params.type || undefined,
      minRating: params.minRating || undefined,
    }),
    [params.category, params.type, params.minRating],
  );

  const toggleNear = async () => {
    if (params.near) {
      navigate({ near: false, sort: "" });
      return;
    }
    const current = position ?? (await geo.request());
    if (current) navigate({ near: true, sort: "" });
  };

  const markerInfo = (marker: MapMarker) => {
    const rating = formatRating(marker.rating_avg);
    const point = toLatLng(marker.latitude, marker.longitude);
    const distance = position && point ? formatDistance(haversineKm(position, point)) : null;
    return (
      <div className="flex w-56 gap-3 text-[#17243d]">
        {marker.profile_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
          <img src={marker.profile_image_url} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-[#4c4cdd]">{marker.category}</p>
            <FavoriteButton establishmentId={marker.id} name={marker.name} className="-mt-1 size-8 shrink-0" />
          </div>
          <p className="flex items-center gap-1 text-xs">
            <Star aria-hidden="true" className="size-3 fill-[#d6154a] text-[#d6154a]" />
            {rating ? (
              <>
                <span className="font-bold">{rating}</span>
                <span className="text-[#6d6e7a]">({marker.rating_count})</span>
              </>
            ) : (
              <span className="text-[#6d6e7a]">Sin reseñas</span>
            )}
            {distance && <span className="ml-1 text-[#6d6e7a]">· {distance}</span>}
          </p>
          <Link href={`/establishments/${marker.id}`} className="inline-block text-xs font-bold text-[#514ddd] hover:underline">
            Ver detalle
          </Link>
        </div>
      </div>
    );
  };

  return (
    <main className="bg-[#f8f9ff] text-[#17243d] lg:grid lg:h-[calc(100vh-4.5rem)] lg:min-h-[36rem] lg:grid-cols-[minmax(26rem,30rem)_1fr]">
      <section className="flex min-h-0 flex-col gap-5 px-5 py-6 lg:overflow-hidden">
        <header className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-3xl font-extrabold">Explorar</h1>
            {items && (
              <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#26344d]">
                {items.length}
                {hasMore ? "+" : ""} {items.length === 1 ? "lugar" : "lugares"}
              </span>
            )}
          </div>

          <label className="flex h-12 items-center gap-3 rounded-2xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
            <Search aria-hidden="true" className="size-5 text-[#4c4cdd]" />
            <span className="sr-only">Buscar lugares</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por nombre o dirección"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
            />
          </label>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <button
              type="button"
              onClick={() => void toggleNear()}
              aria-pressed={nearActive}
              disabled={geo.isLocating}
              className={chipClass(nearActive)}
            >
              {geo.isLocating ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LocateFixed aria-hidden="true" className="size-4" />}
              Cerca de mí
            </button>
            <button type="button" onClick={() => navigate({ category: "" })} className={chipClass(params.category === "")}>
              Todos
            </button>
            {ESTABLISHMENT_CATEGORIES.map((item) => (
              <button key={item} type="button" onClick={() => navigate({ category: item })} className={chipClass(params.category === item)}>
                {item}
              </button>
            ))}
          </div>

          {!nearActive && <LocationPurposeNote />}
          {params.near && !position && geo.message && (
            <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {geo.message} Mientras tanto te mostramos los lugares de Cúcuta.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="explore-type">
              Tipo de establecimiento
            </label>
            <select id="explore-type" value={params.type} onChange={(event) => navigate({ type: event.target.value })} className={selectClass}>
              <option value="">Todos los tipos</option>
              {ESTABLISHMENT_TYPE_KEYS.map((type) => (
                <option key={type} value={type}>
                  {ESTABLISHMENT_TYPES[type]}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="explore-sort">
              Ordenar por
            </label>
            <select id="explore-sort" value={sort} onChange={(event) => navigate({ sort: event.target.value })} className={selectClass}>
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="explore-min">
              Puntuación mínima
            </label>
            <select
              id="explore-min"
              value={params.minRating}
              onChange={(event) => navigate({ minRating: Number(event.target.value) })}
              className={selectClass}
            >
              {MIN_RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {nearActive && (
              <>
                <label className="sr-only" htmlFor="explore-radius">
                  Radio de búsqueda
                </label>
                <select
                  id="explore-radius"
                  value={params.radius}
                  onChange={(event) => navigate({ radius: Number(event.target.value) })}
                  className={selectClass}
                >
                  {RADIUS_OPTIONS.map((radius) => (
                    <option key={radius} value={radius}>
                      A {radius} km
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </header>

        {/* En móvil y tablet, la vista de mapa reemplaza a la lista. */}
        {!isDesktop && params.view === "map" ? (
          <div className="relative -mx-5 h-[65dvh] min-h-[22rem]">
            <EstablishmentsMap
              filters={mapFilters}
              userPosition={position}
              activeId={null}
              selected={selected}
              onSelect={setSelected}
              className="size-full"
            />
            {selected && (
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(23,36,61,0.25)]">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-bold">{selected.name}</p>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Cerrar"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#6d6e7a] hover:bg-[#f3f5fb]"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
                {markerInfo(selected)}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 lg:overflow-y-auto lg:pr-1">
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            {!items && !error && [0, 1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-[#e9edff]" />)}

            {items && items.length === 0 && (
              <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#6d6e7a] shadow-[0_4px_16px_rgba(23,36,61,0.05)]">
                {nearActive
                  ? `No encontramos lugares a menos de ${params.radius} km con esos filtros. Prueba con un radio mayor.`
                  : "No encontramos establecimientos con esos filtros."}
              </p>
            )}

            {items?.map((establishment) => {
              const rating = formatRating(establishment.rating_avg);
              const distance = distanceOf(establishment);
              const active = hoveredId === establishment.id || selected?.id === establishment.id;
              const rawType = establishmentTypeLabel(establishment.establishment_type);
              const typeLabel = rawType && rawType.toLowerCase() !== establishment.category.trim().toLowerCase() ? rawType : null;
              // El corazón es hermano del enlace (un botón dentro de <a> no es válido) y va sobre la foto.
              return (
                <article
                  key={establishment.id}
                  ref={(element) => {
                    if (element) cardRefs.current.set(establishment.id, element);
                    else cardRefs.current.delete(establishment.id);
                  }}
                  onMouseEnter={() => setHoveredId(establishment.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(establishment.id)}
                  onBlur={() => setHoveredId(null)}
                  className={`group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(23,36,61,0.06)] ring-2 transition hover:-translate-y-0.5 hover:shadow-lg ${
                    active ? "ring-[#514ddd]" : "ring-transparent"
                  }`}
                >
                <Link href={`/establishments/${establishment.id}`} className="flex flex-col focus-visible:outline-none sm:flex-row">
                  <div className="relative h-44 bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)] sm:h-auto sm:min-h-32 sm:w-32 sm:shrink-0">
                    {establishment.banner_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={establishment.banner_image_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                    )}
                    {rating && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold shadow">
                        <Star aria-hidden="true" className="size-3 fill-[#d6154a] text-[#d6154a]" />
                        {rating}
                        <span className="font-medium text-[#6d6e7a]">({establishment.rating_count})</span>
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:pr-12">
                    <h2 className="truncate text-lg font-bold group-hover:text-[#4c4cdd]">{establishment.name}</h2>
                    <p className="text-xs font-semibold text-[#4c4cdd]">
                      {establishment.category}
                      {typeLabel && <span className="font-medium text-[#6d6e7a]"> · {typeLabel}</span>}
                    </p>
                    <p className="line-clamp-2 text-sm text-[#6d6e7a]">{establishment.description}</p>
                    <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-[#6d6e7a]">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="truncate">{establishment.address}</span>
                      {distance !== null && <span className="ml-auto shrink-0 font-semibold text-[#26344d]">{formatDistance(distance)}</span>}
                      {establishment.price_range && <span className="shrink-0 font-semibold">{establishment.price_range}</span>}
                    </p>
                  </div>
                </Link>
                <FavoriteButton
                  establishmentId={establishment.id}
                  name={establishment.name}
                  className="absolute right-2 top-2"
                />
                </article>
              );
            })}

            {!nearActive && items && (
              <LoadMoreButton loaded={items.length} hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={() => void loadMore()} />
            )}
          </div>
        )}
      </section>

      {isDesktop && (
        <aside aria-label="Mapa" className="relative hidden lg:block">
          {showMap && (
            <EstablishmentsMap
              filters={mapFilters}
              userPosition={position}
              activeId={hoveredId}
              selected={selected}
              onSelect={setSelected}
              onHover={setHoveredId}
              renderInfo={markerInfo}
              className="size-full"
            />
          )}
        </aside>
      )}

      {/* Botón flotante Lista/Mapa en móvil y tablet. */}
      {!isDesktop && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            navigate({ view: params.view === "map" ? "list" : "map" });
          }}
          className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#17243d] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,36,61,0.35)] md:bottom-6"
        >
          {params.view === "map" ? <List aria-hidden="true" className="size-4" /> : <MapIcon aria-hidden="true" className="size-4" />}
          {params.view === "map" ? "Lista" : "Mapa"}
        </button>
      )}
    </main>
  );
}
