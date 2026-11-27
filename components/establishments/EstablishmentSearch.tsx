"use client";

import { ArrowRight, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { searchEstablishments, type PublicEstablishment } from "@/lib/establishments-api";

type Suggestions = { term: string; items: PublicEstablishment[]; failed?: boolean };

export default function EstablishmentSearch({ className, hero = false }: { className: string; hero?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [result, setResult] = useState<Suggestions>();
  const term = query.trim();
  const expanded = open && term.length >= 2;
  const current = result?.term === term ? result : undefined;
  const items = current?.items ?? [];
  const active = expanded ? items[activeIndex] : undefined;

  useEffect(() => {
    if (active) document.getElementById(`${listId}-${active.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchEstablishments({ search: term, limit: 5 }, { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ term, items: matches ?? [] });
      } catch {
        if (!controller.signal.aborted) setResult({ term, items: [], failed: true });
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [expanded, term]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    close();
    router.push(term ? `/explore?search=${encodeURIComponent(term)}` : "/explore");
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && active) {
      event.preventDefault();
      close();
      router.push(`/establishments/${active.id}`);
      return;
    }
    if (event.key === "Escape" && expanded) {
      event.preventDefault();
      close();
    }
    if (!items.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    setOpen(true);
    const step = event.key === "ArrowDown" ? 1 : -1;
    setActiveIndex(index => index < 0 && step < 0 ? items.length - 1 : (index + step + items.length) % items.length);
  };

  return (
    <form
      role="search"
      aria-label={hero ? "Buscar lugares desde inicio" : "Buscar lugares desde la navegación"}
      action="/explore"
      onSubmit={submit}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
      className={`relative ${className}`}
    >
      <div className={`flex items-center gap-3 rounded-full focus-within:ring-2 focus-within:ring-[#6868e8]/50 ${hero
        ? "bg-white p-2 pl-5 shadow-[0_12px_30px_rgba(23,36,61,0.25)]"
        : "h-11 border border-[#d7dcf2] bg-[#eef0ff] px-4"}`}>
        <Search aria-hidden="true" className="size-5 shrink-0 text-[#514ddd]" />
        <input
          type="search"
          name="search"
          role="combobox"
          autoComplete="off"
          aria-label="Buscar establecimientos"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
          maxLength={150}
          placeholder="Buscar lugares en Cúcuta"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={event => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }}
          onKeyDown={handleKey}
          className="w-full min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#81869a]"
        />
        {hero && (
          <button type="submit" className="flex shrink-0 items-center gap-2 rounded-full bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4542ca]">
            Buscar <ArrowRight aria-hidden="true" className="hidden size-4 sm:block" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-[#dce1f2] bg-white p-1.5 text-left text-[#17243d] shadow-[0_12px_28px_rgba(23,36,61,0.16)]">
          <ul id={listId} role="listbox" aria-label="Establecimientos sugeridos" aria-busy={!current} className="max-h-[min(20rem,50dvh)] overflow-y-auto">
            {items.map((place, index) => (
              <li key={place.id} role="presentation">
                <Link
                  id={`${listId}-${place.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  href={`/establishments/${place.id}`}
                  onClick={close}
                  className="flex items-start gap-3 rounded-xl px-3 py-2 text-sm hover:bg-[#f3f5ff] aria-selected:bg-[#e8ebff]"
                >
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="block font-semibold">{place.name}</span>
                    <span className="block text-xs text-[#596175]">{place.category} · {place.address}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {items.length === 0 && <p role="status" className="px-3 py-2 text-sm text-[#596175]">{!current ? "Buscando…" : current.failed ? "No se pudieron cargar las sugerencias. Pulsa Enter para buscar en Explorar." : "No encontramos establecimientos con esa búsqueda."}</p>}
        </div>
      )}
    </form>
  );
}
