"use client";

import { ArrowLeft, Clock, MapPin, Star } from "lucide-react";
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
      <Navbar />
      <main className="text-[#17243d]">
        <div className="mx-auto max-w-5xl space-y-8 px-5 py-6">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c4cdd] hover:underline">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al directorio
          </Link>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {!detail && !error && <p className="text-sm text-[#6d6e7a]">Cargando establecimiento...</p>}

          {detail && (
            <>
              <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e6f0]">
                <div className="relative h-56 bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)] sm:h-72">
                  {detail.banner_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={detail.banner_image_url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                  {detail.profile_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={detail.profile_image_url} alt="" className="-mt-16 size-24 rounded-2xl border-4 border-white object-cover shadow-md" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4c4cdd]">{detail.category}</p>
                    <h1 className="text-3xl font-bold">{detail.name}</h1>
                    <p className="flex items-center gap-1.5 text-sm text-[#6d6e7a]">
                      <MapPin aria-hidden="true" className="size-4" />
                      {detail.address}
                    </p>
                  </div>
                  {detail.price_range && <span className="self-start rounded-full bg-[#eef2ff] px-3 py-1 text-sm font-bold text-[#4c4cdd]">{detail.price_range}</span>}
                </div>
                <p className="border-t border-[#f0f2f8] px-6 py-5 text-sm leading-relaxed text-[#43506a]">{detail.description}</p>
              </section>

              {detail.gallery_images.length > 0 && (
                <Section title="Galería">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {detail.gallery_images.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img key={image.id} src={image.image_url} alt={image.caption ?? ""} className="aspect-video w-full rounded-xl object-cover" />
                    ))}
                  </div>
                </Section>
              )}

              {detail.menu_images.length > 0 && (
                <Section title="Menú físico">
                  <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                    {detail.menu_images.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img key={image.id} src={image.image_url} alt={image.caption ?? "Menú"} className="h-80 snap-start rounded-xl object-contain ring-1 ring-[#e4e6f0]" />
                    ))}
                  </div>
                </Section>
              )}

              {detail.combos.length > 0 && (
                <Section title="Combos">
                  <MenuGrid items={detail.combos} />
                </Section>
              )}

              {detail.products.length > 0 && (
                <Section title="Carta">
                  <MenuGrid items={detail.products} />
                </Section>
              )}

              <Section title="Reseñas">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Star aria-hidden="true" className="size-8 fill-amber-400 text-amber-400" />
                    <div>
                      <p className="text-2xl font-bold">{detail.average_rating !== null ? detail.average_rating.toFixed(1) : "—"}</p>
                      <p className="text-xs text-[#6d6e7a]">
                        {detail.reviews_count} {detail.reviews_count === 1 ? "reseña" : "reseñas"}
                      </p>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 rounded-xl bg-[#eef2ff] px-4 py-3 text-sm text-[#4c4cdd]">
                    <Clock aria-hidden="true" className="size-4" />
                    Próximamente podrás dejar tu reseña.
                  </p>
                </div>
              </Section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0]">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="flex gap-4 rounded-xl bg-[#f8f9ff] p-3">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img src={item.image_url} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              <span className="shrink-0 text-sm font-bold">{formatCop(item.price)}</span>
            </div>
            {item.description && <p className="line-clamp-2 text-xs text-[#6d6e7a]">{item.description}</p>}
            {item.combo_items.length > 0 && (
              <p className="mt-1 text-xs text-[#4c4cdd]">
                Incluye: {item.combo_items.map((ci) => `${ci.quantity} × ${ci.product_name ?? ""}`).join(", ")}
              </p>
            )}
            {!item.is_available && <p className="mt-1 text-xs font-semibold text-red-600">No disponible</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
