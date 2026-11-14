"use client";

import { ArrowLeft, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PlanBuilder from "@/components/plans/PlanBuilder.tsx";
import { formatRating, searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

// Asistente para crear un plan. Con `?establishment={id}` empieza en "Fecha y hora"; sin él, primero se
// elige el lugar.
export default function NewPlanPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#17243d] md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/plans" className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd]">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Mis planes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Nuevo plan</h1>
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
    <section className="space-y-5 rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold">¿A dónde vas?</h2>
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((place) => {
            const rating = formatRating(place.rating_avg);
            return (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => router.replace(`/plans/new?establishment=${place.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-[#eceef7] transition hover:bg-[#f3f5ff] hover:ring-[#c9cdf4]"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eef0ff] text-[#514ddd]">
                    {place.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={place.profile_image_url} alt="" className="size-full object-cover" />
                    ) : (
                      <MapPin aria-hidden="true" className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{place.name}</span>
                    <span className="block truncate text-xs text-[#6d6e7a]">
                      {place.category}
                      {rating ? ` · ★ ${rating}` : ""}
                    </span>
                    <span className="block truncate text-xs text-[#81869a]">{place.address}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
