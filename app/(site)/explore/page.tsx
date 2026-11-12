"use client";

import { Map as MapIcon, MapPin, Search, Star } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ESTABLISHMENT_CATEGORIES, averageRating, searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

const SEARCH_DEBOUNCE_MS = 300;

const chipClass = (active: boolean) =>
  `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-[#4c4cdd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
  }`;

type ExploreQuery = { search?: string; category?: string };

// Lee ?search= (buscador del navbar) y ?category= (categorías del inicio). La vista se remonta con `key` cuando
// cambian, porque navegar a /explore?search=... estando ya en /explore no vuelve a montar la página.
export default function ExplorePage({ searchParams }: { searchParams: Promise<ExploreQuery> }) {
  const { search = "", category = "" } = use(searchParams);
  return <ExploreView key={`${search}|${category}`} initialSearch={search} initialCategory={category} />;
}

function ExploreView({ initialSearch, initialCategory }: { initialSearch: string; initialCategory: string }) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch.trim());
  const [category, setCategory] = useState(initialCategory);
  const [items, setItems] = useState<PublicEstablishment[] | null>(null);
  const [error, setError] = useState("");

  // Espera a que el usuario deje de escribir antes de consultar.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    searchEstablishments({ search: search || undefined, category: category || undefined })
      .then((data) => {
        if (!cancelled) {
          setItems(data ?? []);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el directorio.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, category]);

  return (
    <>
      <main className="bg-[#f8f9ff] text-[#17243d] lg:grid lg:h-[calc(100vh-4.5rem)] lg:min-h-[36rem] lg:grid-cols-[minmax(26rem,30rem)_1fr]">
        <section className="flex min-h-0 flex-col gap-5 px-5 py-6 lg:overflow-hidden">
          <header className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-3xl font-extrabold">Explorar</h1>
              {items && (
                <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#26344d]">
                  {items.length} {items.length === 1 ? "lugar" : "lugares"}
                </span>
              )}
            </div>

            <label className="flex h-12 items-center gap-3 rounded-2xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
              <Search aria-hidden="true" className="size-5 text-[#4c4cdd]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre o dirección"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
              />
            </label>

            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              <button type="button" onClick={() => setCategory("")} className={chipClass(category === "")}>
                Todos
              </button>
              {ESTABLISHMENT_CATEGORIES.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={chipClass(category === item)}>
                  {item}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-4 lg:overflow-y-auto lg:pr-1">
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            {!items && !error &&
              [0, 1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-[#e9edff]" />)}

            {items && items.length === 0 && (
              <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#6d6e7a] shadow-[0_4px_16px_rgba(23,36,61,0.05)]">
                No encontramos establecimientos con esos filtros.
              </p>
            )}

            {items?.map((establishment) => {
              const rating = averageRating(establishment);
              return (
                <Link
                  key={establishment.id}
                  href={`/establishments/${establishment.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(23,36,61,0.06)] transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
                >
                  <div className="relative h-44 bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)] sm:h-auto sm:min-h-32 sm:w-32 sm:shrink-0">
                    {establishment.banner_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={establishment.banner_image_url} alt="" className="absolute inset-0 size-full object-cover" />
                    )}
                    {rating !== null && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold shadow">
                        <Star aria-hidden="true" className="size-3 fill-[#d6154a] text-[#d6154a]" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                    <h2 className="truncate text-lg font-bold group-hover:text-[#4c4cdd]">{establishment.name}</h2>
                    <p className="text-xs font-semibold text-[#4c4cdd]">{establishment.category}</p>
                    <p className="line-clamp-2 text-sm text-[#6d6e7a]">{establishment.description}</p>
                    <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-[#6d6e7a]">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="truncate">{establishment.address}</span>
                      {establishment.price_range && <span className="ml-auto shrink-0 font-semibold">{establishment.price_range}</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside
          aria-label="Mapa"
          className="hidden items-center justify-center bg-[linear-gradient(135deg,#e9edff,#f1f3fb)] lg:flex"
        >
          <div className="flex flex-col items-center gap-3 text-center text-[#6d6e7a]">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-[#4c4cdd] shadow">
              <MapIcon aria-hidden="true" className="size-6" />
            </span>
            <p className="text-sm font-semibold">Mapa próximamente</p>
          </div>
        </aside>
      </main>
    </>
  );
}
