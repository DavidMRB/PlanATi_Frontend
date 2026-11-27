"use client";

import { Compass, Heart, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireRole from "@/components/common/RequireRole";
import EstablishmentCard from "@/components/establishments/EstablishmentCard";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listFavorites } from "@/lib/favorites-api";
import { establishmentTypeLabel, type PublicEstablishment } from "@/lib/establishments-api";

const PAGE_SIZE = 20;

// Mis favoritos (solo cuentas `user` con el teléfono verificado, como exige el backend).
export default function FavoritesPage() {
  return (
    <RequireRole roles={["user"]} requireVerifiedPhone>
      <FavoritesView />
    </RequireRole>
  );
}

function FavoritesView() {
  const { isFavorite } = useFavorites();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<PublicEstablishment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (skip: number) => {
    const page = await listFavorites({ skip, limit: PAGE_SIZE });
    const list = page?.items ?? [];
    setItems((current) =>
      skip === 0 ? list : [...(current ?? []), ...list.filter((item) => !current?.some((known) => known.id === item.id))],
    );
    setTotal(page?.total ?? 0);
    setError("");
  }, []);

  useEffect(() => {
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    Promise.resolve()
      .then(() => load(0))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tus favoritos.");
        setItems([]);
      });
  }, [load]);

  // Un lugar que se quita aquí se queda en su sitio (con el corazón vacío) para poder deshacerlo con otro
  // toque; al volver a la página ya no aparece. "Cargar más" cuenta solo los que siguen guardados.
  const kept = items?.filter((item) => isFavorite(item.id, true)) ?? [];
  const removedCount = (items?.length ?? 0) - kept.length;
  const remainingTotal = Math.max(total - removedCount, kept.length);
  const types = [...new Set(items?.map(item => item.establishment_type))];
  const term = query.trim().toLocaleLowerCase("es-CO");
  const visible = (items ?? []).filter(item =>
    (!type || item.establishment_type === type) &&
    [item.name, item.category, item.address].some(value => value.toLocaleLowerCase("es-CO").includes(term))
  );

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      await load(kept.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar más favoritos.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5eafb] pb-4 lg:rounded-2xl lg:bg-gradient-to-r lg:from-[#eef0ff] lg:to-[#edf8f7] lg:p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mis favoritos</h1>
            <p className="text-sm text-[#43506a]">
              Los lugares que guardaste con <Heart aria-label="el corazón" className="inline size-4 fill-[#d6154a] text-[#d6154a]" /> para
              volver o planear una visita.
            </p>
          </div>
          {items && items.length > 0 && (
            <span className="rounded-full bg-[#c6f7f0] px-3 py-1 text-xs font-bold text-[#0b6b5c]">
              {remainingTotal} {remainingTotal === 1 ? "lugar guardado" : "lugares guardados"}
            </span>
          )}
        </header>

        {items && items.length > 0 && (
          <div className="space-y-3">
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-[#514ddd]">
              <Search aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
              <span className="sr-only">Buscar entre los favoritos cargados</span>
              <input type="search" placeholder="Buscar en tus guardados" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <div role="group" aria-label="Tipo de establecimiento" className="flex flex-wrap gap-2">
              {["", ...types].map(value => (
                <button type="button" key={value} aria-pressed={type === value} onClick={() => setType(value)} className={"rounded-full bg-[#e8edff] px-3 py-2 text-xs font-bold text-[#43506a] aria-pressed:bg-[#006c60] aria-pressed:text-white"}>
                  {value ? establishmentTypeLabel(value) ?? value : "Todos"}
                </button>
              ))}
            </div>
            {(term || type) && <p role="status" className="text-xs text-[#43506a]">{visible.length} coincidencias entre los lugares cargados.</p>}
          </div>
        )}

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {!items && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 3 }, (_, key) => (
              <div key={key} className="h-72 animate-pulse rounded-2xl bg-[#eef2ff]" />
            ))}
          </div>
        )}

        {items && items.length === 0 && !error && (
          <EmptyState
            icon={Heart}
            title="Aún no tienes favoritos"
            description="Toca el corazón en cualquier lugar del directorio para guardarlo aquí."
            action={
              <Link
                href="/explore"
                className="flex h-11 items-center gap-2 rounded-xl bg-[#514ddd] px-5 text-sm font-bold text-white hover:bg-[#4542ca]"
              >
                <Compass aria-hidden="true" className="size-4" />
                Explorar lugares
              </Link>
            }
          />
        )}

        {items && items.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((establishment) => (
                <EstablishmentCard
                  key={establishment.id}
                  establishment={establishment}
                  showPlanActions
                  className={isFavorite(establishment.id, true) ? "" : "opacity-60"}
                />
              ))}
            </div>
            <LoadMoreButton
              loaded={kept.length}
              total={remainingTotal}
              isLoading={isLoadingMore}
              onLoadMore={() => void loadMore()}
            />
          </>
        )}
      </div>
    </main>
  );
}
