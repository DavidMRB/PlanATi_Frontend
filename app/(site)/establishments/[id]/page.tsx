"use client";

import { ArrowLeft, BookOpen, CalendarPlus, Clock, ExternalLink, MapPin, Navigation, Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  establishmentTypeLabel,
  formatRating,
  getEstablishmentDetail,
  type EstablishmentSchedule,
  type PublicEstablishmentDetail,
} from "@/lib/establishments-api";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { StaticLocationMap } from "@/components/map/lazy";
import { useAuth } from "@/components/providers/AuthProvider";
import { ReportButton } from "@/components/reviews/ReportDialog";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { directionsUrl, mapsSearchUrl, toLatLng } from "@/lib/geo";
import { formatCop } from "@/lib/format";
import type { MenuItem } from "@/lib/restaurant-api";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

const shortTime = (value: string) => value.slice(0, 5);

// JS: getDay() 0 = domingo; el backend usa 0 = lunes.
const todayIndex = () => (new Date().getDay() + 6) % 7;

function openStatus(schedules: EstablishmentSchedule[]): { open: boolean; closesAt: string | null } | null {
  if (schedules.length === 0) return null;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = schedules.filter((schedule) => schedule.day_of_week === todayIndex());
  for (const schedule of today) {
    const [openH, openM] = schedule.opening_time.split(":").map(Number);
    const [closeH, closeM] = schedule.closing_time.split(":").map(Number);
    if (minutes >= openH * 60 + openM && minutes < closeH * 60 + closeM) {
      return { open: true, closesAt: shortTime(schedule.closing_time) };
    }
  }
  return { open: false, closesAt: null };
}

export default function EstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const establishmentId = Number(id);
  const isValidId = Number.isInteger(establishmentId) && establishmentId > 0;

  const { user } = useAuth();
  // "Planear visita" es para cuentas `user` (sin sesión, /plans/new manda al login y vuelve).
  const canPlan = !user || user.role === "user";
  const [detail, setDetail] = useState<PublicEstablishmentDetail | null>(null);
  const [error, setError] = useState(() => (isValidId ? "" : "Este establecimiento no existe."));

  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;
    getEstablishmentDetail(establishmentId)
      .then((data) => {
        if (!cancelled) setDetail(data ?? null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el establecimiento.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [establishmentId, isValidId]);

  // Tras publicar, editar o borrar una reseña: promedio, distribución y campos viewer_* nuevos.
  const reloadDetail = useCallback(async () => {
    try {
      const data = await getEstablishmentDetail(establishmentId);
      if (data) setDetail(data);
    } catch {
      // Se conserva lo que ya se ve.
    }
  }, [establishmentId]);

  const schedules = detail?.schedules ?? [];
  const status = openStatus(schedules);
  const ratingText = formatRating(detail?.rating_avg ?? detail?.average_rating);
  const ratingCount = detail?.rating_count ?? detail?.reviews_count ?? 0;
  const typeLabel = establishmentTypeLabel(detail?.establishment_type);
  const gallery = detail?.gallery_images ?? [];
  const extraPhotos = gallery.length > 4 ? gallery.length - 3 : 0;
  const galleryPreview = extraPhotos > 0 ? gallery.slice(0, 3) : gallery.slice(0, 4);

  // Con coordenadas: "Cómo llegar" con ruta; sin ellas, búsqueda por dirección en Google Maps.
  const point = detail ? toLatLng(detail.latitude, detail.longitude) : null;
  const routeUrl = detail
    ? point
      ? directionsUrl(point.lat, point.lng, detail.google_place_id)
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`
    : "#";
  const openMapUrl = point ? mapsSearchUrl(point.lat, point.lng, detail?.google_place_id) : routeUrl;

  return (
    <>
      <main className="min-h-screen bg-[#f8f9ff] text-[#17243d]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 md:hidden">
            <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c4cdd]">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Explorar
            </Link>
          </div>
        </div>

        {error && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          </div>
        )}
        {!detail && !error && <p className="py-10 text-center text-sm text-[#6d6e7a]">Cargando establecimiento...</p>}

        {detail && (
          <>
            {/* Portada a todo el ancho */}
            <div className="relative h-56 bg-[linear-gradient(135deg,#dfe9ff,#e2faf5)] sm:h-80 lg:h-[26rem]">
              {detail.banner_image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                <img src={detail.banner_image_url} alt="" className="size-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f8f9ff]" />
            </div>

            <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
                <div className="min-w-0 space-y-10">
                  {/* Tarjeta principal sobre la portada */}
                  <section className={`${card} relative -mt-16 space-y-5 p-6 shadow-[0_12px_32px_rgba(23,36,61,0.12)] sm:-mt-24 sm:p-8`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#5df0dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#0b4a40]">
                          {detail.category}
                        </span>
                        {typeLabel && typeLabel.toLowerCase() !== detail.category.trim().toLowerCase() && (
                          <span className="rounded-md bg-[#f3f5fb] px-3 py-1 text-xs font-bold text-[#43506a]">{typeLabel}</span>
                        )}
                        {detail.price_range && (
                          <span className="rounded-md bg-[#eef0ff] px-3 py-1 text-xs font-extrabold text-[#514ddd]">
                            {detail.price_range}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <a href="#reviews" className="flex items-center gap-1.5 text-sm font-semibold">
                          <Star aria-hidden="true" className="size-5 fill-[#d6154a] text-[#d6154a]" />
                          {ratingText ?? "—"}
                          <span className="text-[#6d6e7a] underline decoration-[#c9cdf4] underline-offset-4">
                            ({ratingCount} {ratingCount === 1 ? "reseña" : "reseñas"})
                          </span>
                        </a>
                        <FavoriteButton
                          establishmentId={detail.id}
                          name={detail.name}
                          initial={detail.is_favorite}
                          className="bg-[#f3f5fb] shadow-none ring-1 ring-[#e4e6f0]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {detail.profile_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                        <img
                          src={detail.profile_image_url}
                          alt=""
                          className="size-16 shrink-0 rounded-2xl object-cover shadow-md sm:size-20"
                        />
                      )}
                      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{detail.name}</h1>
                    </div>

                    <p className="flex items-start gap-2 text-sm text-[#43506a] sm:text-base">
                      <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#17243d]" />
                      {detail.address}
                    </p>

                    <div className={`grid gap-3 ${canPlan ? "sm:grid-cols-2" : ""}`}>
                      {canPlan && (
                        <Link
                          href={`/plans/new?establishment=${detail.id}`}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
                        >
                          <CalendarPlus aria-hidden="true" className="size-4" />
                          Planear visita
                        </Link>
                      )}
                      <a
                        href={routeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold ${
                          canPlan
                            ? "bg-[#eef0ff] text-[#514ddd] hover:bg-[#e2e5ff]"
                            : "bg-[#514ddd] text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
                        }`}
                      >
                        <Navigation aria-hidden="true" className="size-4" />
                        {point ? "Cómo llegar" : "Consultar ubicación"}
                        <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
                      </a>
                    </div>
                  </section>

                  <Section title="Sobre el lugar">
                    <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-[#43506a]">{detail.description}</p>
                  </Section>

                  {detail.products.length > 0 && (
                    <Section title="Menú destacado">
                      <MenuGrid items={detail.products.slice(0, 4)} />
                      {detail.products.length > 4 && (
                        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#514ddd]">
                          <BookOpen aria-hidden="true" className="size-4" />
                          Y {detail.products.length - 4} {detail.products.length - 4 === 1 ? "producto más" : "productos más"} en su carta
                        </p>
                      )}
                    </Section>
                  )}

                  {detail.combos.length > 0 && (
                    <Section title="Combos">
                      <MenuGrid items={detail.combos} />
                    </Section>
                  )}

                  {detail.menu_images.length > 0 && (
                    <Section title="Menú físico">
                      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                        {detail.menu_images.map((image) => (
                          // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                          <img
                            key={image.id}
                            src={image.image_url}
                            alt={image.caption ?? "Menú"}
                            className="h-64 w-auto max-w-[85vw] snap-start rounded-xl object-contain ring-1 ring-[#e4e6f0]"
                          />
                        ))}
                      </div>
                    </Section>
                  )}

                  <div id="reviews" className="scroll-mt-24">
                    <Section title="Reseñas">
                      <ReviewsSection detail={detail} onChanged={reloadDetail} />
                    </Section>
                  </div>
                </div>

                <aside className="space-y-6 lg:pt-6">
                  <section className={`${card} space-y-4 p-6 lg:-mt-24 lg:shadow-[0_12px_32px_rgba(23,36,61,0.12)]`}>
                    <h2 className="flex items-center gap-2 text-xl font-extrabold">
                      <Clock aria-hidden="true" className="size-5 text-[#0b6b5c]" />
                      Horarios
                    </h2>
                    {schedules.length === 0 ? (
                      <p className="text-sm text-[#6d6e7a]">Este lugar aún no publicó sus horarios.</p>
                    ) : (
                      <>
                        {status && (
                          <p
                            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${
                              status.open ? "bg-[#e3f7f3] text-[#0b6b5c]" : "bg-[#fde0e3] text-[#a30f35]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span aria-hidden="true" className={`size-2 rounded-full ${status.open ? "bg-[#0b6b5c]" : "bg-[#d6154a]"}`} />
                              {status.open ? "Abierto ahora" : "Cerrado ahora"}
                            </span>
                            {status.open && status.closesAt && (
                              <span className="text-xs font-semibold">Cierra a las {status.closesAt}</span>
                            )}
                          </p>
                        )}
                        <ul className="space-y-3 pt-1 text-sm">
                          {/* GUIA #9 TEMA: Matrices (creación, recorrido y operaciones) -> consulta: muestra la fila (tramos) de cada día del horario. */}
                          {DAYS.map((day, index) => {
                            const daySchedules = schedules.filter((schedule) => schedule.day_of_week === index);
                            const isToday = index === todayIndex();
                            return (
                              <li
                                key={day}
                                className={`flex items-center justify-between ${daySchedules.length === 0 ? "text-[#9295a4]" : ""} ${isToday ? "font-bold" : ""}`}
                              >
                                <span>{day}</span>
                                <span className={daySchedules.length > 0 ? "font-semibold" : ""}>
                                  {daySchedules.length > 0
                                    ? daySchedules
                                        .map((schedule) => `${shortTime(schedule.opening_time)} - ${shortTime(schedule.closing_time)}`)
                                        .join(" · ")
                                    : "Cerrado"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </section>

                  <section id="ubicacion" className={`${card} space-y-4 p-6`}>
                    <h2 className="text-base font-bold text-[#43506a]">Ubicación</h2>
                    {point ? (
                      <StaticLocationMap
                        latitude={point.lat}
                        longitude={point.lng}
                        name={detail.name}
                        establishmentType={detail.establishment_type}
                        className="h-44"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center rounded-2xl bg-[#e4edff] px-5 text-center">
                        <span>
                          <MapPin aria-hidden="true" className="mx-auto size-8 text-[#514ddd]" />
                          <span className="mt-2 block text-xs font-semibold text-[#43506a]">
                            Este lugar aún no tiene su ubicación en el mapa.
                          </span>
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-[#43506a]">{detail.address}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={routeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#514ddd] text-xs font-bold text-white hover:bg-[#4542ca]"
                      >
                        <Navigation aria-hidden="true" className="size-3.5" />
                        Cómo llegar
                      </a>
                      <a
                        href={openMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#eef0ff] text-xs font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
                      >
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                        Google Maps
                      </a>
                    </div>
                  </section>

                  {gallery.length > 0 && (
                    <section className={`${card} space-y-4 p-6`}>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-bold text-[#43506a]">Fotografías</h2>
                        <span className="text-xs font-bold text-[#514ddd]">
                          {gallery.length} {gallery.length === 1 ? "foto" : "fotos"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {galleryPreview.map((image) => (
                          // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                          <img
                            key={image.id}
                            src={image.image_url}
                            alt={image.caption ?? ""}
                            className="aspect-[4/3] w-full rounded-xl object-cover"
                          />
                        ))}
                        {extraPhotos > 0 && (
                          <span className="flex aspect-[4/3] items-center justify-center rounded-xl bg-[#17243d]/80 text-lg font-extrabold text-white">
                            +{extraPhotos}
                          </span>
                        )}
                      </div>
                    </section>
                  )}

                  <div className="flex justify-end">
                    <ReportButton targetType="ESTABLISHMENT" targetId={detail.id} targetLabel="este lugar" ownerId={detail.owner_id} label="Reportar este lugar" />
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-xl font-extrabold tracking-tight">{title}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-[#d7dcf2] to-transparent" />
        {action}
      </div>
      {children}
    </section>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return <p className="text-sm text-[#6d6e7a]">No hay productos publicados.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="flex gap-4 rounded-2xl bg-[#eef2ff] p-2.5">
          <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#dfe3f7] text-[#9aa0d8]">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
              <img src={item.image_url} alt="" className="size-full object-cover" />
            ) : (
              <UtensilsCrossed aria-hidden="true" className="size-6" />
            )}
          </span>
          <div className="min-w-0 flex-1 py-1">
            <h3 className="text-base font-bold leading-snug">{item.name}</h3>
            {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#43506a]">{item.description}</p>}
            {item.combo_items.length > 0 && (
              <p className="mt-1 line-clamp-1 text-xs text-[#514ddd]">
                Incluye: {item.combo_items.map((ci) => `${ci.quantity}× ${ci.product_name ?? ""}`).join(", ")}
              </p>
            )}
            <p className="mt-1 text-sm font-bold text-[#514ddd]">{formatCop(item.price)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
