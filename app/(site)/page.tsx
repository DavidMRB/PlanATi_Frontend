"use client";

import { ArrowRight, BedDouble, Coffee, FerrisWheel, Loader2, LocateFixed, MapPin, Martini, ShoppingBag, Star, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import EstablishmentSearch from "@/components/establishments/EstablishmentSearch";
import EstablishmentCard from "@/components/establishments/EstablishmentCard";
import AccountDeletedNotice from "@/components/privacy/AccountDeletedNotice";
import LocationPurposeNote from "@/components/privacy/LocationPurposeNote";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatRating, searchEstablishments, searchNearbyEstablishments, type PublicEstablishment } from "@/lib/establishments-api";
import { formatCop } from "@/lib/format";

const RECOMMENDED_LIMIT = 4;
const EXPERIENCES_LIMIT = 2;
const NEARBY_RADIUS_KM = 10;
const TOP_RATED_LIMIT = 4;

type HomeCategory = { label: string; icon: LucideIcon; href: string; tone: string };

const CATEGORIES: HomeCategory[] = [
  // Cada acceso filtra el directorio por tipo de establecimiento (?type=, B7).
  { label: "Gastronomía", icon: Utensils, href: "/explore?type=RESTAURANT", tone: "bg-[#5b57e6] text-white" },
  { label: "Cafés", icon: Coffee, href: "/explore?type=CAFE", tone: "bg-[#5df0dc] text-[#0b5c52]" },
  { label: "Bares", icon: Martini, href: "/explore?type=BAR", tone: "bg-[#d6154a] text-white" },
  { label: "Hoteles", icon: BedDouble, href: "/explore?type=HOTEL", tone: "bg-[#e5e3fb] text-[#514ddd]" },
  { label: "Experiencias", icon: FerrisWheel, href: "/explore?type=EXPERIENCE", tone: "bg-[#fde0e3] text-[#d6154a]" },
  { label: "Tiendas", icon: ShoppingBag, href: "/explore?type=STORE", tone: "bg-[#c6f7f0] text-[#0b5c52]" },
];

type Experience = {
  key: string;
  href: string | null;
  tag: string;
  tagTone: string;
  title: string;
  description: string;
  price: string | null;
  place: string | null;
  imageUrl: string | null;
  background: string;
};

type RecommendedItem = { establishment: PublicEstablishment; distanceKm: number | null };

const COMBO_BACKGROUNDS = ["bg-[linear-gradient(135deg,#9fa8c4,#5d6d8f)]", "bg-[linear-gradient(135deg,#f3e3cf,#d9b99a)]"];

// Los combos publicados por los establecimientos alimentan "Experiencias del momento".
function comboExperiences(establishments: PublicEstablishment[]): Experience[] {
  const experiences: Experience[] = [];
  for (const establishment of establishments) {
    const combo = establishment.menu_items?.find((item) => item.is_combo && item.is_available);
    if (!combo) continue;
    experiences.push({
      key: `${establishment.id}-${combo.id}`,
      href: `/establishments/${establishment.id}`,
      tag: establishment.category,
      tagTone: experiences.length % 2 === 0 ? "bg-[#d6154a] text-white" : "bg-[#0b6b5c] text-white",
      title: combo.name,
      description: combo.description || establishment.description,
      price: formatCop(combo.price),
      place: establishment.name,
      imageUrl: combo.image_url ?? establishment.banner_image_url,
      background: COMBO_BACKGROUNDS[experiences.length % COMBO_BACKGROUNDS.length],
    });
    if (experiences.length === EXPERIENCES_LIMIT) break;
  }
  return experiences;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#514ddd]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className="flex items-center gap-1 pb-1 text-sm font-semibold text-[#514ddd] hover:underline">
          {action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [general, setGeneral] = useState<RecommendedItem[] | null>(null);
  const [nearby, setNearby] = useState<RecommendedItem[] | null>(null);
  const [topRated, setTopRated] = useState<PublicEstablishment[] | null>(null);
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [recommendedError, setRecommendedError] = useState(false);
  // La ubicación se pide solo con un gesto (botón), salvo que el permiso ya esté concedido.
  const geo = useGeolocation({ mode: "nearby" });

  useEffect(() => {
    let cancelled = false;

    searchEstablishments({})
      .then((data) => {
        if (cancelled) return;
        const establishments = data ?? [];
        setExperiences(comboExperiences(establishments));
        setGeneral(establishments.slice(0, RECOMMENDED_LIMIT).map((establishment) => ({ establishment, distanceKm: null })));
      })
      .catch(() => {
        if (cancelled) return;
        setRecommendedError(true);
        setExperiences([]);
      });

    searchEstablishments({ sort: "rating", limit: TOP_RATED_LIMIT })
      .then((data) => {
        if (!cancelled) setTopRated((data ?? []).filter((item) => item.rating_count > 0));
      })
      .catch(() => {
        if (!cancelled) setTopRated([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Con ubicación se priorizan los establecimientos más cercanos y se muestra la distancia.
  const lat = geo.position?.lat;
  const lng = geo.position?.lng;
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let cancelled = false;
    searchNearbyEstablishments({ latitude: lat, longitude: lng, radiusKm: NEARBY_RADIUS_KM, limit: RECOMMENDED_LIMIT })
      .then((data) => {
        if (cancelled || !data || data.length === 0) return;
        setNearby(data.map(({ distance_km, ...establishment }) => ({ establishment, distanceKm: distance_km })));
      })
      .catch(() => {
        // Se mantiene el listado general.
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const recommended = nearby ?? general;
  const showLocationPrompt = !nearby && geo.status !== "granted";

  const cover = general?.find(({ establishment }) => establishment.banner_image_url)?.establishment.banner_image_url;

  return (
    <>
      <main className="bg-[#f8f9ff] text-[#17243d]">
        <AccountDeletedNotice />
        <section className="relative flex items-center justify-center bg-[#eef1ff] px-5 py-8 md:py-12 lg:min-h-[25rem] lg:bg-[#383887] lg:py-16">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element -- Portada publicada por el establecimiento
            <img src={cover} alt="" className="absolute inset-0 hidden size-full object-cover lg:block" />
          )}
          <div className="absolute inset-0 hidden bg-[#17243d]/55 lg:block" />
          <div className="relative flex w-full max-w-6xl flex-col items-start gap-4 text-[#17243d] lg:items-center lg:text-center lg:text-white">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">Descubre Cúcuta, A Tu Ritmo</h1>
            <p className="max-w-xl text-sm text-[#43506a] sm:text-base lg:text-white/90">
              Encuentra los mejores lugares, eventos y experiencias que la ciudad tiene para ofrecerte hoy.
            </p>
            <EstablishmentSearch hero className="z-20 w-full max-w-2xl" />
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-9 px-4 pb-12 sm:px-6 lg:space-y-16">
          <nav aria-label="Categorías" className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-6 rounded-b-2xl bg-white px-3 py-4 lg:py-7 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
            {CATEGORIES.map(({ label, icon: Icon, href, tone }) => (
              <Link key={label} href={href} className="group flex shrink-0 flex-col items-center gap-2 text-sm font-semibold">
                <span className={`flex size-10 lg:size-14 items-center justify-center rounded-full transition group-hover:scale-105 ${tone}`}>
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                {label}
              </Link>
            ))}
          </nav>

          <section className="space-y-6">
            <SectionHeading eyebrow="Combos publicados" title="Experiencias del momento" />
            {!experiences && <p role="status">Cargando experiencias…</p>}
            {experiences?.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-[#43506a]">{recommendedError ? "No fue posible cargar las experiencias." : "Todavía no hay combos publicados."}</p>}
            <div className="grid gap-6 md:grid-cols-2">
              {experiences?.map((experience) => {
                const card = (
                  <>
                    <div className={`relative h-52 sm:h-60 ${experience.background}`}>
                      {experience.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                        <img src={experience.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                      )}
                      <span className={`absolute bottom-3 left-4 rounded-full px-3 py-1 text-xs font-semibold ${experience.tagTone}`}>
                        {experience.tag}
                      </span>
                    </div>
                    <div className="space-y-2 p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-xl font-bold">{experience.title}</h3>
                        {experience.price && <span className="shrink-0 text-lg font-bold text-[#514ddd]">{experience.price}</span>}
                      </div>
                      <p className="line-clamp-2 text-sm leading-relaxed text-[#6d6e7a]">{experience.description}</p>
                      {experience.place && (
                        <p className="flex items-center gap-1.5 text-xs text-[#6d6e7a]">
                          <MapPin aria-hidden="true" className="size-3.5" />
                          {experience.place}
                        </p>
                      )}
                    </div>
                  </>
                );
                const className = "overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";
                return experience.href ? (
                  <Link key={experience.key} href={experience.href} className={`${className} transition hover:-translate-y-0.5 hover:shadow-lg`}>
                    {card}
                  </Link>
                ) : (
                  <article key={experience.key} className={className}>
                    {card}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <SectionHeading
              eyebrow={nearby ? "Cerca de ti" : "Selección local"}
              title={nearby ? "Recomendados cerca de ti" : "Recomendados en Cúcuta"}
              action={{ href: nearby ? "/explore?near=1" : "/explore", label: "Ver todos" }}
            />

            {showLocationPrompt && (
              <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.05)] sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">¿Quieres ver primero los lugares más cercanos?</p>
                  <LocationPurposeNote />
                  {geo.message && <p className="text-xs text-amber-700">{geo.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void geo.request()}
                  disabled={geo.isLocating}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-4 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-60"
                >
                  {geo.isLocating ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LocateFixed aria-hidden="true" className="size-4" />}
                  Usar mi ubicación
                </button>
              </div>
            )}

            {recommendedError && (
              <p className="rounded-xl bg-white p-6 text-center text-sm text-[#6d6e7a]">No fue posible cargar los recomendados en este momento.</p>
            )}

            {!recommended && !recommendedError && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: RECOMMENDED_LIMIT }, (_, key) => (
                  <div key={key} className="h-72 animate-pulse rounded-2xl bg-[#eef2ff]" />
                ))}
              </div>
            )}

            {recommended && recommended.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-sm text-[#6d6e7a]">Aún no hay establecimientos publicados.</p>
            )}

            {recommended && recommended.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map(({ establishment, distanceKm }) => (
                  <EstablishmentCard key={establishment.id} establishment={establishment} distanceKm={distanceKm} />
                ))}
              </div>
            )}
          </section>

          {topRated && topRated.length > 0 && (
            <section className="space-y-6">
              <SectionHeading eyebrow="Lo que opina la comunidad" title="Mejor puntuados" action={{ href: "/explore?sort=rating", label: "Ver más" }} />
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {topRated.map((establishment, index) => (
                  <li key={establishment.id}>
                    <Link
                      href={`/establishments/${establishment.id}`}
                      className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-sm font-extrabold text-[#514ddd]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold group-hover:text-[#514ddd]">{establishment.name}</span>
                        <span className="block truncate text-xs text-[#6d6e7a]">{establishment.category}</span>
                        <span className="mt-1 flex items-center gap-1 text-xs font-bold">
                          <Star aria-hidden="true" className="size-3.5 fill-[#f5a524] text-[#f5a524]" />
                          {formatRating(establishment.rating_avg)}
                          <span className="font-medium text-[#6d6e7a]">
                            ({establishment.rating_count} {establishment.rating_count === 1 ? "reseña" : "reseñas"})
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
