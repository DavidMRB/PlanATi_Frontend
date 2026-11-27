import { ArrowRight, CalendarPlus, MapPin, Star } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { establishmentTypeLabel, formatRating, type PublicEstablishment } from "@/lib/establishments-api";
import { formatDistance } from "@/lib/geo";

type EstablishmentCardProps = {
  establishment: PublicEstablishment;
  distanceKm?: number | null;
  className?: string;
  showPlanActions?: boolean;
};

// Tarjeta vertical de un lugar (inicio y "Mis favoritos"). El corazón es hermano del enlace, no hijo:
// un botón dentro de un <a> no es HTML válido y el clic navegaría.
export default function EstablishmentCard({ establishment, distanceKm = null, className = "", showPlanActions = false }: EstablishmentCardProps) {
  const rating = formatRating(establishment.rating_avg);
  // El tipo solo se muestra si no repite la categoría ("Restaurante" · "Restaurante").
  const rawType = establishmentTypeLabel(establishment.establishment_type);
  const typeLabel = rawType && rawType.toLowerCase() !== establishment.category.trim().toLowerCase() ? rawType : null;

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] transition hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      <Link href={`/establishments/${establishment.id}`} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#514ddd]">
        <div className={`relative bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)] ${showPlanActions ? "h-48 sm:h-52" : "h-44"}`}>
          {establishment.banner_image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img src={establishment.banner_image_url} alt="" loading="lazy" className="size-full object-cover" />
          )}
          {showPlanActions && <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-md bg-[#17243d]/85 px-2 py-1 text-xs font-semibold text-white">{establishment.category}</span>}
          {rating !== null && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold shadow">
              <Star aria-hidden="true" className="size-3 fill-[#f5a524] text-[#f5a524]" />
              {rating}
              <span className="font-medium text-[#6d6e7a]">({establishment.rating_count})</span>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {!showPlanActions && <span className="rounded-md bg-[#eef0ff] px-2 py-0.5 font-semibold text-[#514ddd]">{establishment.category}</span>}
            {typeLabel && <span className="text-[#6d6e7a]">{typeLabel}</span>}
            {establishment.price_range && <span className="text-[#6d6e7a]">{(!showPlanActions || typeLabel) && "• "}{establishment.price_range}</span>}
          </div>
          <h3 className="truncate text-lg font-bold group-hover:text-[#514ddd]">{establishment.name}</h3>
          <p className="line-clamp-2 text-sm text-[#6d6e7a]">{establishment.description}</p>
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-[#6d6e7a]">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{establishment.address}</span>
            {distanceKm !== null && <span className="ml-auto shrink-0 font-semibold">{formatDistance(distanceKm)}</span>}
          </p>
        </div>
      </Link>
      {showPlanActions && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-center text-xs font-bold">
          <Link href={`/plans/new?establishment=${establishment.id}`} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#514ddd] px-2 text-white hover:bg-[#4542ca]"><CalendarPlus aria-hidden="true" className="size-4" /> Crear plan</Link>
          <Link href={`/establishments/${establishment.id}`} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#eef0ff] px-2 text-[#514ddd] hover:bg-[#e2e5ff]">Ver ficha <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
      )}
      <FavoriteButton establishmentId={establishment.id} name={establishment.name} className="absolute right-3 top-3" />
    </article>
  );
}
