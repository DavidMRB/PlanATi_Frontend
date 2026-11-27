"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleCheck, Clock, MapPin, Search, Star, Store, Users, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import NotificationsBell from "@/components/common/NotificationsBell";
import PlanBuilder from "@/components/plans/PlanBuilder.tsx";
import { formatRating, openStatus, searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

// Asistente para crear un plan. Con `?establishment={id}` empieza en "Fecha y hora"; sin él, primero se
// elige el lugar.
export default function NewPlanPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-10">
      <header className="flex items-center gap-4 border-b border-[#e9ecf8] px-5 py-3 md:hidden">
        <Link href="/plans" aria-label="Volver a mis planes"><ArrowLeft aria-hidden="true" className="size-5" /></Link>
        <h1 className="flex-1 text-xl font-bold">Crear plan</h1>
        <NotificationsBell />
      </header>
      <div className="mx-auto max-w-[60rem] px-5 py-4 lg:max-w-[76rem] lg:px-8 lg:py-6">
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
    return <><h1 className="mb-5 hidden text-3xl font-extrabold md:block">Crear nuevo plan</h1><PlanBuilder key={establishmentId} establishmentId={establishmentId} /></>;
  }
  return <PlacePicker />;
}

const STEPS = [
  { label: "Establecimiento", short: "Lugar", icon: Store },
  { label: "Fecha y detalles", short: "Detalles", icon: CalendarDays },
  { label: "Menú y combos", short: "Menú", icon: Utensils },
  { label: "Confirmación", short: "Confirmar", icon: CircleCheck },
];

const FILTERS = [
  { label: "Todos", value: "" },
  { label: "Restaurantes", value: "RESTAURANT" },
  { label: "Cafés", value: "CAFE" },
  { label: "Bares", value: "BAR" },
  { label: "Experiencias", value: "EXPERIENCE" },
];

function PlacePicker() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicEstablishment[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<PublicEstablishment | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchEstablishments({ search: query.trim() || undefined, establishmentType: type || undefined, sort: "ranking", limit: 12 }, { signal: controller.signal })
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
  }, [query, type]);

  const continuePlan = () => {
    if (selected) router.replace(`/plans/new?establishment=${selected.id}`);
  };

  return (
    <div className="space-y-6">
      <header className="hidden space-y-1 lg:block">
        <p className="mb-4 flex items-center gap-2 text-xs"><Link href="/plans" className="text-[#596175] hover:underline">Mis planes</Link><span aria-hidden="true">›</span> Nuevo plan</p>
        <p className="text-xs font-bold uppercase tracking-wide text-[#006c60]">PlanATi Planner Cúcuta</p>
        <h1 className="text-[2rem] font-extrabold tracking-tight">Crear nuevo plan</h1>
        <p className="text-[#43506a]">Organiza tu próxima salida gastronómica en Cúcuta.</p>
      </header>

      <div className="md:hidden">
        <div className="flex justify-between gap-2 text-xs">
          <strong className="text-[#4643d6]">PASO 1 DE 4</strong><span>Seleccionar local</span>
        </div>
        <Progress />
      </div>

      <div className="hidden md:block lg:rounded-xl lg:bg-white lg:p-4">
        <ol aria-label="Pasos para crear un plan" className="flex justify-between gap-3 lg:grid lg:grid-cols-4">
          {STEPS.map(({ label, short, icon: Icon }, index) => (
            <li key={label} aria-current={index === 0 ? "step" : undefined} className={`flex items-center gap-2 md:flex-col lg:flex-row ${index === 0 ? "font-bold text-[#4643d6]" : "text-[#596175]"}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-[#4643d6] text-white" : "bg-[#e5ebfa]"}`}>
                <Icon aria-hidden="true" className="size-5 lg:hidden" /><span className="hidden text-lg lg:inline">{index + 1}</span>
              </span>
              <span className="text-xs lg:hidden">{index + 1}. {short}</span>
              <span className="hidden text-sm lg:block"><small className="block uppercase tracking-wide">Paso {index + 1}</small>{label}</span>
            </li>
          ))}
        </ol>
        <Progress />
      </div>

      <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.43fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <section aria-label="Seleccionar establecimiento" className="space-y-5 lg:rounded-xl lg:bg-white lg:p-6">
            <div className="hidden md:block">
              <p className="mb-1 text-xs font-bold tracking-wide text-[#4643d6]">PASO 1 DE 4</p>
              <h1 className="text-3xl font-extrabold tracking-tight lg:hidden">¿A dónde quieres ir hoy?</h1>
              <p className="mt-1 text-sm text-[#43506a] lg:hidden">Elige un lugar de Cúcuta para organizar tu próxima visita.</p>
              <h2 className="hidden items-center justify-between gap-3 text-xl font-bold lg:flex">Selecciona el lugar en Cúcuta <Store aria-hidden="true" className="size-6 shrink-0 text-[#4643d6]" /></h2>
            </div>
            <div className="space-y-2">
              <label htmlFor="plan-place-search" className="sr-only text-sm font-semibold lg:not-sr-only">Buscar local o categoría</label>
              <div className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-3.5 shadow-sm focus-within:ring-2 focus-within:ring-[#514ddd] lg:bg-[#eef2ff] lg:shadow-none">
                <Search aria-hidden="true" className="size-4 shrink-0 text-[#4643d6]" />
                <input id="plan-place-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca un restaurante, café o bar" className="w-full min-w-0 bg-transparent text-sm outline-none" />
                {query && <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery("")} className="grid size-8 shrink-0 place-items-center"><X aria-hidden="true" className="size-4" /></button>}
              </div>
            </div>
            <div role="group" aria-label="Tipo de establecimiento" className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(filter => <button key={filter.label} type="button" aria-pressed={type === filter.value} onClick={() => setType(filter.value)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${type === filter.value ? "bg-[#4643d6] text-white md:bg-[#006c60]" : "bg-[#e9efff] text-[#43506a]"}`}>{filter.label}</button>)}
            </div>
            <h2 className="flex items-center justify-between gap-2 text-xl font-bold md:hidden">{query.trim() || type ? "Resultados" : "Recomendados hoy"} <span className="text-xs text-[#4643d6]">Cúcuta</span></h2>
            <h3 className="hidden text-sm font-semibold text-[#43506a] lg:block">{query.trim() || type ? "Resultados de búsqueda" : "Establecimientos destacados"}</h3>
            {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : results === null ? (
              <p role="status" className="rounded-xl bg-white p-4 text-sm">Buscando establecimientos…</p>
            ) : results.length === 0 ? <p className="text-sm text-[#43506a]">No encontramos establecimientos con esos filtros.</p> : (
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                {results.map(place => <li key={place.id} className="min-w-0"><PlaceOption place={place} active={selected?.id === place.id} onSelect={() => setSelected(place)} /></li>)}
              </ul>
            )}
          </section>
          <div className="mt-7 hidden justify-end lg:flex"><ContinueButton disabled={!selected} onClick={continuePlan} /></div>
        </div>

        <aside className="hidden min-w-0 overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] md:block">
          {selected && (
            <div className="relative hidden h-44 overflow-hidden bg-[#222359] lg:block">
              <PlacePhoto place={selected} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111936] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-4 py-3 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#74f3e2]">Establecimiento</p>
                <p className="text-xl font-bold [overflow-wrap:anywhere]">{selected.name}</p>
              </div>
            </div>
          )}
          <div className="space-y-4 p-4 lg:p-6">
            <h2 className="text-xl font-bold">Resumen de visita</h2>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef2ff] p-3">
              <Store aria-hidden="true" className="size-5 shrink-0 text-[#4643d6]" />
              <div className="min-w-0 text-sm [overflow-wrap:anywhere]">
                <p className="font-bold">{selected?.name ?? "Elige un establecimiento"}</p>
                {selected && <p className="mt-1 text-xs text-[#596175]">{selected.address}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#eef2ff] p-2.5"><CalendarDays aria-hidden="true" className="mb-1 size-4 text-[#4643d6]" />Fecha y hora <strong className="block">Por definir</strong></div>
              <div className="rounded-lg bg-[#eef2ff] p-2.5"><Users aria-hidden="true" className="mb-1 size-4 text-[#4643d6]" />Comensales <strong className="block">Por definir</strong></div>
            </div>
            <div className="border-t border-[#e5ebfa] pt-4 text-sm">
              <h3 className="font-semibold">Consumos agregados</h3>
              <p className="mt-1 text-xs text-[#596175]">Podrás elegir productos y combos en el paso de menú.</p>
            </div>
            <div className="rounded-xl bg-[#eef2ff] p-4"><EstimatedTotal /></div>
            <div className="md:[&_button]:w-full lg:hidden"><ContinueButton disabled={!selected} onClick={continuePlan} label="Continuar a detalles" /></div>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[#e1e6f4] bg-[#f8f9ff]/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(23,36,61,0.08)] md:hidden">
        <EstimatedTotal />
        <ContinueButton disabled={!selected} onClick={continuePlan} />
      </div>
    </div>
  );
}

function Progress() {
  return <div aria-hidden="true" className="mt-2 h-1.5 rounded-full bg-[#e3eafa]"><div className="h-full w-1/4 rounded-full bg-[#4643d6]" /></div>;
}

function PlacePhoto({ place }: { place: PublicEstablishment }) {
  const src = place.banner_image_url ?? place.profile_image_url;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- Portadas públicas del establecimiento.
    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
  ) : <span className="grid size-full place-items-center bg-[#e3eafa] text-[#4643d6]"><Store aria-hidden="true" className="size-6" /></span>;
}

function PlaceOption({ place, active, onSelect }: { place: PublicEstablishment; active: boolean; onSelect: () => void }) {
  const rating = formatRating(place.rating_avg);
  const hours = openStatus(place.schedules ?? []);
  return (
    <button type="button" aria-pressed={active} onClick={onSelect} className={`grid h-full w-full grid-cols-[clamp(3.75rem,22vw,6rem)_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl p-3 text-left shadow-sm ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4643d6] md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-center lg:p-4 ${active ? "bg-[#e4ebff] ring-[#514ddd]" : "bg-white ring-transparent hover:ring-[#b9c2f4] lg:bg-[#eef2ff]"}`}>
      <span className="relative row-span-2 aspect-square w-full overflow-hidden rounded-lg md:col-span-2 md:row-span-1 md:aspect-[16/10] lg:col-span-1 lg:row-span-2 lg:aspect-square">
        <PlacePhoto place={place} />
        {rating && <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-1 text-xs font-bold md:right-1.5 md:left-auto lg:hidden"><Star aria-hidden="true" className="size-3 fill-amber-400 text-amber-500" />{rating}</span>}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {active && <span className="mb-1 hidden w-fit rounded bg-[#4643d6] px-2 py-0.5 text-xs font-semibold text-white lg:block">Seleccionado</span>}
        <span className="block text-base font-bold leading-tight lg:text-lg">{place.name}</span>
        <span className="mt-1 flex items-start gap-1 text-xs text-[#43506a]"><MapPin aria-hidden="true" className="size-3.5 shrink-0 text-[#006c60]" />{place.address}</span>
        {hours && <span className="mt-1 hidden items-center gap-1 text-xs text-[#43506a] lg:flex"><Clock aria-hidden="true" className="size-3.5" />{hours.open ? `Abierto hasta ${hours.closesAt}` : "Cerrado ahora"}</span>}
      </span>
      <span aria-hidden="true" className="flex flex-col items-end gap-2">
        {rating && <span className="hidden items-center gap-1 rounded bg-white px-2 py-1 text-xs font-bold lg:flex"><Star className="size-3 fill-amber-400 text-amber-500" />{rating} <span className="font-normal text-[#596175]">({place.rating_count})</span></span>}
        <span className={`grid size-5 place-items-center rounded-full border ${active ? "border-[#4643d6] bg-[#4643d6] text-white" : "border-[#b8c2d5] text-transparent"}`}><Check className="size-3" /></span>
      </span>
      <span className="col-span-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1 text-xs font-semibold text-[#006c60]"><span className="min-w-0 [overflow-wrap:anywhere]">{place.category}</span>{place.price_range && <span className="text-[#43506a]">{place.price_range}</span>}</span>
    </button>
  );
}

function EstimatedTotal() {
  return <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#596175]">Total estimado</p><p className="text-sm font-bold">Por calcular</p></div>;
}

function ContinueButton({ disabled, onClick, label = "Continuar" }: { disabled: boolean; onClick: () => void; label?: string }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4643d6] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#3835bd] disabled:opacity-50">{label}<ArrowRight aria-hidden="true" className="size-4 shrink-0" /></button>;
}
