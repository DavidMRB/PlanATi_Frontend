"use client";

import { ArrowLeft, BookOpen, Clock, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import Navbar from "@/components/common/Navbar";
import { getEstablishmentDetail, type PublicEstablishmentDetail } from "@/lib/establishments-api";
import { formatCop } from "@/lib/format";
import type { MenuItem } from "@/lib/restaurant-api";

export default function EstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const establishmentId = Number(id);
  const isValidId = Number.isInteger(establishmentId) && establishmentId > 0;

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

  return (
    <>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <main className="min-h-screen bg-[#f8f9ff] text-[#17243d]">
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 md:py-6">
            <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c4cdd] hover:underline">
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Volver al directorio</span>
              <span className="sm:hidden">Explorar</span>
            </Link>
            <span className="text-xs font-semibold text-[#6d6e7a]">Detalle del lugar</span>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {!detail && !error && <p className="py-10 text-center text-sm text-[#6d6e7a]">Cargando establecimiento...</p>}

          {detail && (
            <div className="space-y-5 md:space-y-8">
              <section className="relative overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
                <div className="relative h-56 bg-[linear-gradient(135deg,#dfe9ff,#e2faf5)] sm:h-72 lg:h-[25rem]">
                  {detail.banner_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={detail.banner_image_url} alt="" className="size-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17243d]/25 to-transparent" />
                </div>
                <div className="relative -mt-8 mx-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.12)] sm:-mt-10 sm:mx-6 sm:p-6 lg:mx-10 lg:-mt-16">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {detail.profile_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={detail.profile_image_url} alt="" className="size-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md sm:size-24" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#c6f7f0] px-3 py-1 text-xs font-bold text-[#0b6b5c]">{detail.category}</span>
                        {detail.price_range && <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#4c4cdd]">{detail.price_range}</span>}
                      </div>
                      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{detail.name}</h1>
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-[#6d6e7a]">
                        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#4c4cdd]" />
                        {detail.address}
                      </p>
                    </div>
                    <RatingSummary detail={detail} compact />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="#ubicacion" className="rounded-xl bg-[#514ddd] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#4542ca]">
                      Cómo llegar
                    </Link>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
                <div className="min-w-0 space-y-5 md:space-y-8">
                  <Section title="Sobre el lugar">
                    <p className="max-w-3xl text-sm leading-7 text-[#566078]">{detail.description}</p>
                  </Section>

                  {detail.products.length > 0 && (
                    <Section title="Menú destacado" action={`${detail.products.length} ${detail.products.length === 1 ? "producto" : "productos"}`}>
                      <MenuGrid items={detail.products.slice(0, 4)} />
                    </Section>
                  )}

                  {detail.combos.length > 0 && (
                    <Section title="Combos">
                      <MenuGrid items={detail.combos} />
                    </Section>
                  )}

                  <Section title="Reseñas" action={detail.reviews_count > 0 ? `${detail.reviews_count} ${detail.reviews_count === 1 ? "reseña" : "reseñas"}` : undefined}>
                    <div className="grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
                      <RatingSummary detail={detail} />
                      <p className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-3 text-sm text-[#4c4cdd]">
                        <Clock aria-hidden="true" className="size-4 shrink-0" />
                        Próximamente podrás dejar tu reseña.
                      </p>
                    </div>
                  </Section>
                </div>

                <aside className="space-y-5">
                  <section id="ubicacion" className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
                    <h2 className="text-base font-bold">Ubicación</h2>
                    <div className="mt-4 flex h-36 items-center justify-center rounded-xl bg-[#e4edff] text-center">
                      <div className="px-5">
                        <MapPin aria-hidden="true" className="mx-auto size-7 text-[#4c4cdd]" />
                        <p className="mt-2 text-xs font-semibold text-[#43506a]">{detail.address}</p>
                      </div>
                    </div>
                    {(detail.latitude || detail.longitude) && <p className="mt-3 text-xs text-[#6d6e7a]">Coordenadas disponibles para consultar la ruta.</p>}
                  </section>

                  {detail.gallery_images.length > 0 && (
                    <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-bold">Fotografías</h2>
                        <span className="text-xs font-semibold text-[#4c4cdd]">{detail.gallery_images.length} fotos</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {detail.gallery_images.slice(0, 6).map((image) => (
                          // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                          <img key={image.id} src={image.image_url} alt={image.caption ?? ""} className="aspect-square w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    </section>
                  )}
                </aside>
              </div>

              {detail.menu_images.length > 0 && (
                <Section title="Menú físico">
                  <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                    {detail.menu_images.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img key={image.id} src={image.image_url} alt={image.caption ?? "Menú"} className="h-64 w-auto max-w-[85vw] snap-start rounded-xl object-contain ring-1 ring-[#e4e6f0]" />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="h-5 w-1 rounded-full bg-[#514ddd]" />
          {title}
        </h2>
        {action && <span className="text-xs font-semibold text-[#4c4cdd]">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function RatingSummary({ detail, compact = false }: { detail: PublicEstablishmentDetail; compact?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 rounded-xl ${compact ? "bg-[#fff3f6] px-3 py-2" : "bg-[#eef0ff] p-4"}`}>
      <Star aria-hidden="true" className={`${compact ? "size-5" : "size-8"} fill-[#d6154a] text-[#d6154a]`} />
      <div>
        <p className={`${compact ? "text-base" : "text-3xl"} font-bold`}>{detail.average_rating !== null ? detail.average_rating.toFixed(1) : "—"}</p>
        <p className="text-xs text-[#6d6e7a]">{detail.reviews_count} {detail.reviews_count === 1 ? "reseña" : "reseñas"}</p>
      </div>
    </div>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return <p className="text-sm text-[#6d6e7a]">No hay productos publicados.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-xl bg-[#eef2ff]">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img src={item.image_url} alt="" className="h-32 w-full object-cover" />
          )}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              <span className="shrink-0 text-sm font-bold text-[#4c4cdd]">{formatCop(item.price)}</span>
            </div>
            {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6d6e7a]">{item.description}</p>}
            {item.combo_items.length > 0 && (
              <p className="mt-2 flex items-start gap-1 text-xs text-[#4c4cdd]">
                <BookOpen aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                Incluye: {item.combo_items.map((ci) => `${ci.quantity} × ${ci.product_name ?? ""}`).join(", ")}
              </p>
            )}
            {!item.is_available && <p className="mt-2 text-xs font-semibold text-[#d6154a]">No disponible</p>}
          </div>
        </article>
      ))}
    </div>
  );
}