"use client";

import { ArrowLeft, BookOpen, Clock, ExternalLink, MapPin, Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import {
  getEstablishmentDetail,
  type EstablishmentSchedule,
  type PublicEstablishmentDetail,
  type PublicReview,
} from "@/lib/establishments-api";
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

function timeAgo(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  return new Date(value).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export default function EstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const establishmentId = Number(id);
  const isValidId = Number.isInteger(establishmentId) && establishmentId > 0;

  const [detail, setDetail] = useState<PublicEstablishmentDetail | null>(null);
  const [error, setError] = useState(() => (isValidId ? "" : "Este establecimiento no existe."));
  const [showAllReviews, setShowAllReviews] = useState(false);

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

  const schedules = detail?.schedules ?? [];
  const status = openStatus(schedules);
  const reviews = [...(detail?.reviews ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const gallery = detail?.gallery_images ?? [];
  const extraPhotos = gallery.length > 4 ? gallery.length - 3 : 0;
  const galleryPreview = extraPhotos > 0 ? gallery.slice(0, 3) : gallery.slice(0, 4);

  const mapsUrl = detail
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        detail.latitude && detail.longitude ? `${detail.latitude},${detail.longitude}` : detail.address,
      )}`
    : "#";

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
                        {detail.price_range && (
                          <span className="rounded-md bg-[#eef0ff] px-3 py-1 text-xs font-extrabold text-[#514ddd]">
                            {detail.price_range}
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Star aria-hidden="true" className="size-5 fill-[#d6154a] text-[#d6154a]" />
                        {detail.average_rating !== null ? detail.average_rating.toFixed(1) : "—"}
                        <span className="text-[#6d6e7a] underline decoration-[#c9cdf4] underline-offset-4">
                          ({detail.reviews_count} {detail.reviews_count === 1 ? "reseña" : "reseñas"})
                        </span>
                      </p>
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

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
                    >
                      <MapPin aria-hidden="true" className="size-4" />
                      Consultar ubicación
                      <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
                    </a>
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

                  <Section
                    title="Reseñas"
                    action={
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6d6e7a]">
                        <Clock aria-hidden="true" className="size-3.5" />
                        Próximamente podrás dejar tu reseña
                      </span>
                    }
                  >
                    {reviews.length === 0 ? (
                      <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#6d6e7a] shadow-[0_4px_16px_rgba(23,36,61,0.05)]">
                        Este lugar aún no tiene reseñas.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {visibleReviews.map((review) => (
                          <ReviewCard key={review.id} review={review} establishmentName={detail.name} />
                        ))}
                      </ul>
                    )}
                    {reviews.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllReviews((value) => !value)}
                        className="mx-auto mt-5 block text-sm font-bold text-[#26344d] hover:text-[#514ddd]"
                      >
                        {showAllReviews ? "Ver menos reseñas" : `Ver las ${reviews.length} reseñas`}
                      </button>
                    )}
                  </Section>
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
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-44 items-center justify-center rounded-2xl bg-[#e4edff] text-center transition hover:bg-[#d9e5ff]"
                    >
                      <span className="px-5">
                        <MapPin aria-hidden="true" className="mx-auto size-8 text-[#514ddd]" />
                        <span className="mt-2 block text-xs font-semibold text-[#43506a]">Abrir en el mapa</span>
                      </span>
                    </a>
                    <p className="text-sm text-[#43506a]">{detail.address}</p>
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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={`size-4 ${value <= rating ? "fill-[#d6154a] text-[#d6154a]" : "text-[#d7dcf2]"}`}
        />
      ))}
    </span>
  );
}

// La API pública de reseñas no entrega el nombre del autor, solo su user_id.
function ReviewCard({ review, establishmentName }: { review: PublicReview; establishmentName: string }) {
  return (
    <li className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#6d69ea] text-xs font-bold text-white">
            <UtensilsCrossed aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Comensal de PlanATi</p>
            <p className="text-xs text-[#6d6e7a]">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm leading-7 text-[#43506a]">{review.comment}</p>
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {review.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img key={image.id} src={image.image_url} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}
      {review.reply && (
        <div className="rounded-xl bg-[#eef0ff] p-4 text-sm">
          <p className="text-xs font-bold text-[#514ddd]">Respuesta de {establishmentName}</p>
          <p className="mt-1 text-[#43506a]">{review.reply.comment}</p>
        </div>
      )}
    </li>
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
