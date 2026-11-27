"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Search, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PlanBuilder from "@/components/plans/PlanBuilder.tsx";
import { formatRating, searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

// Asistente para crear un plan. Con `?establishment={id}` empieza en "Fecha y hora"; sin él, primero se
// elige el lugar.
export default function NewPlanPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/plans" className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd]">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Mis planes
        </Link>
        <header className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Crear nuevo plan</h1>
          <p className="text-sm text-[#43506a]">Elige un lugar de Cúcuta y organiza tu próxima visita.</p>
        </header>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-[#eef0ff]" />}>
          <NewPlanContent />
        </Suspense>
      </div>
    </main>
  );
}

function NewPlanContent() {
  const params = useSearchParams();
  const establishmentId = Number(params.get("establishment"));
  if (Number.isInteger(establishmentId) && establishmentId > 0) {
    // La key reinicia el asistente si se cambia de lugar.
    return <PlanBuilder key={establishmentId} establishmentId={establishmentId} />;
  }
  return <PlacePicker />;
}

function PlacePicker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicEstablishment[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<PublicEstablishment | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchEstablishments({ search: query.trim() || undefined, sort: "ranking", limit: 12 }, { signal: controller.signal })
        .then((items) => {
          setResults(items ?? []);
          setError("");
        })
        .catch(() => {
          if (!controller.signal.aborted) setError("No fue posible buscar lugares.");
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="space-y-5">
      <ol aria-label="Pasos para crear un plan" className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-xs font-bold text-[#43506a] sm:grid-cols-4">
        {["Establecimiento", "Fecha y hora", "Menú", "Confirmación"].map((label, index) => (
          <li key={label} aria-current={index === 0 ? "step" : undefined} className={`flex items-center gap-2 rounded-xl px-2 py-2 ${index === 0 ? "bg-[#eef0ff] text-[#514ddd]" : ""}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-[#514ddd] text-white" : "bg-[#f1f3ff]"}`}>{index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(17rem,2fr)]">
        <section className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
          <div className="space-y-1">
            <h2 className="flex items-center justify-between gap-2 text-xl font-extrabold">Selecciona el lugar en Cúcuta <CalendarDays aria-hidden="true" className="size-5 text-[#514ddd]" /></h2>
            <p className="text-sm text-[#6d6e7a]">Elige el lugar del plan.</p>
          </div>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-[#d7dcf2] bg-[#f3f5ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/40">
            <Search aria-hidden="true" className="size-5 shrink-0 text-[#43506a]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o categoría"
              aria-label="Buscar lugar"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {results === null ? (
            <div className="h-40 animate-pulse rounded-2xl bg-[#eef0ff]" aria-busy="true" />
          ) : results.length === 0 ? (
            <p className="text-sm text-[#6d6e7a]">No encontramos lugares con esa búsqueda.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {results.map((place) => {
                const rating = formatRating(place.rating_avg);
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      aria-pressed={selected?.id === place.id}
                      onClick={() => setSelected(place)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 transition hover:ring-[#514ddd] ${selected?.id === place.id ? "bg-[#eef0ff] ring-[#514ddd]" : "bg-[#f5f7ff] ring-transparent"}`}
                    >
                      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eef0ff] text-[#514ddd]">
                        {place.banner_image_url || place.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                          <img src={place.banner_image_url ?? place.profile_image_url ?? ""} alt="" className="size-full object-cover" />
                        ) : (
                          <MapPin aria-hidden="true" className="size-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{place.name}</span>
                        <span className="block truncate text-xs text-[#6d6e7a]">
                          {place.category}
                        </span>
                        <span className="block truncate text-xs text-[#81869a]">{place.address}</span>
                      </span>
                      {rating && <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold"><Star aria-hidden="true" className="size-3 fill-amber-400 text-amber-500" />{rating}</span>}
                      {selected?.id === place.id && <Check aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <aside className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] lg:sticky lg:top-24">
          {selected?.banner_image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- Imagen del establecimiento
            <img src={selected.banner_image_url} alt="" className="hidden h-40 w-full object-cover lg:block" />
          )}
          <div className="space-y-3 p-4 sm:p-5">
            <h2 className="text-base font-extrabold">Resumen de visita</h2>
            {selected ? (
              <div className="rounded-xl bg-[#eef0ff] p-3">
                <p className="font-bold">{selected.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#43506a]"><MapPin aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />{selected.address}</p>
              </div>
            ) : <p className="text-sm text-[#43506a]">Selecciona un establecimiento para continuar.</p>}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-[#e4e6f0] bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:block lg:border-0 lg:bg-transparent lg:p-0">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#43506a] lg:hidden">{selected?.name ?? "Elige un lugar"}</span>
              <button type="button" disabled={!selected} onClick={() => selected && router.replace(`/plans/new?establishment=${selected.id}`)} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-4 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-50 lg:w-full">
                Continuar <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
