"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/common/Navbar";
import { ESTABLISHMENT_CATEGORIES, searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

const SEARCH_DEBOUNCE_MS = 300;

export default function ExplorePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
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
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 text-[#17243d]">
        <header className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold">Explora</h1>
            <p className="text-sm text-[#6d6e7a]">Encuentra establecimientos cerca de ti que se ajusten a lo que necesitas.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-white px-4 ring-1 ring-[#e4e6f0] focus-within:ring-[#6868e8]/50">
              <Search aria-hidden="true" className="size-5 text-[#81869a]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre o dirección"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 rounded-xl bg-white px-4 text-sm font-semibold text-[#26344d] ring-1 ring-[#e4e6f0] outline-none"
            >
              <option value="">Todas las categorías</option>
              {ESTABLISHMENT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </header>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {!items && !error && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-64 animate-pulse rounded-2xl bg-[#eef2ff]" />
            ))}
          </div>
        )}

        {items && items.length === 0 && (
          <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#6d6e7a] ring-1 ring-[#e4e6f0]">
            No encontramos establecimientos con esos filtros.
          </p>
        )}

        {items && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((establishment) => (
              <Link
                key={establishment.id}
                href={`/establishments/${establishment.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e6f0] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="h-36 bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)]">
                  {establishment.banner_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={establishment.banner_image_url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center gap-3">
                    {establishment.profile_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={establishment.profile_image_url} alt="" className="-mt-10 size-14 rounded-xl border-4 border-white object-cover" />
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate font-bold group-hover:text-[#4c4cdd]">{establishment.name}</h2>
                      <p className="text-xs font-semibold text-[#4c4cdd]">{establishment.category}</p>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-[#6d6e7a]">{establishment.description}</p>
                  <p className="mt-auto flex items-center gap-1.5 text-xs text-[#6d6e7a]">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {establishment.address}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
