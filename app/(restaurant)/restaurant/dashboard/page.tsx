"use client";

import {
  ArrowRight,
  BadgeCheck,
  Eye,
  Images,
  MapPin,
  Package,
  Phone,
  Plus,
  Star,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getEstablishmentDetail } from "@/lib/establishments-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL, formatCop } from "@/lib/format";
import {
  getRestaurantProfile,
  listProducts,
  listRestaurantImages,
  type EstablishmentImage,
  type MenuItem,
  type RestaurantProfile,
} from "@/lib/restaurant-api";

type Rating = { average: number | null; count: number };

type ModuleCard = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tag: string;
  action: string;
  headerTone: string;
  headerImage: string | null;
  badge: string | null;
  badgeTone: string;
  buttonTone: string;
  footer: ReactNode;
  extra: ReactNode;
};

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

export default function RestaurantDashboardPage() {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [images, setImages] = useState<EstablishmentImage[] | null>(null);
  const [catalog, setCatalog] = useState<MenuItem[] | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);

  useEffect(() => {
    getRestaurantProfile()
      .then((data) => {
        setProfile(data ?? null);
        if (!data) return;
        getEstablishmentDetail(data.id)
          .then((detail) => {
            if (detail) setRating({ average: detail.average_rating, count: detail.reviews_count });
          })
          .catch(() => setRating(null));
      })
      .catch(() => setProfile(null));

    listRestaurantImages("GALLERY")
      .then((data) => setImages(data ?? []))
      .catch(() => setImages(null));
    listProducts()
      .then((data) => setCatalog(data ?? []))
      .catch(() => setCatalog(null));
  }, []);

  const products = catalog?.filter((item) => !item.is_combo) ?? [];
  const combos = catalog?.filter((item) => item.is_combo) ?? [];
  const availableProducts = products.filter((item) => item.is_available).length;
  const activeCombos = combos.filter((item) => item.is_available);
  const managerFirstName = profile?.manager_name?.split(/\s+/)[0];

  const stats: Array<{ icon: LucideIcon; tone: string; value: string; label: string; hint: string }> = [
    {
      icon: Images,
      tone: "bg-[#eef0ff] text-[#514ddd]",
      value: images ? String(images.length) : "—",
      label: "Fotos de la galería",
      hint: "Imágenes visibles para tus clientes",
    },
    {
      icon: UtensilsCrossed,
      tone: "bg-[#c6f7f0] text-[#0b6b5c]",
      value: catalog ? String(products.length) : "—",
      label: "Productos en carta",
      hint: catalog ? `${availableProducts} disponibles hoy` : "Carta individual",
    },
    {
      icon: Package,
      tone: "bg-[#fde0e3] text-[#d6154a]",
      value: catalog ? String(combos.length) : "—",
      label: "Combos",
      hint: catalog ? `${activeCombos.length} activos` : "Combos y promociones",
    },
    {
      icon: Star,
      tone: "bg-[#eef0ff] text-[#514ddd]",
      value: rating?.average != null ? rating.average.toFixed(1) : "—",
      label: "Valoración promedio",
      hint: rating ? `Basado en ${rating.count} ${rating.count === 1 ? "reseña" : "reseñas"}` : "Reseñas de tus clientes",
    },
  ];

  const modules: ModuleCard[] = [
    {
      href: "/restaurant/profile",
      label: "Editar perfil",
      description: "Datos comerciales, logo y portada.",
      icon: Store,
      tag: "Identidad del local",
      action: "Editar perfil",
      headerTone: "bg-[linear-gradient(135deg,#3f3bb5,#6d69ea)]",
      headerImage: profile?.banner_image_url ?? null,
      badge: null,
      badgeTone: "",
      buttonTone: "bg-[#514ddd] hover:bg-[#4542ca]",
      footer: <span className="text-xs text-[#6d6e7a]">Logo, portada y datos de contacto</span>,
      extra: profile && (
        <ul className="space-y-2 rounded-2xl bg-[#f3f5ff] p-4 text-sm text-[#26344d]">
          <li className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
            <span className="truncate">{profile.address}</span>
          </li>
          {profile.phone && (
            <li className="flex items-center gap-2">
              <Phone aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
              {profile.phone}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Tag aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
            {profile.category}
            {profile.price_range ? ` • ${profile.price_range}` : ""}
          </li>
        </ul>
      ),
    },
    {
      href: "/restaurant/gallery",
      label: "Galería y fotos",
      description: "Galería del lugar y fotos del menú.",
      icon: Images,
      tag: "Multimedia",
      action: "Gestionar fotos",
      headerTone: "bg-[linear-gradient(135deg,#0b6b5c,#5df0dc)]",
      headerImage: images?.[0]?.image_url ?? null,
      badge: images ? `${images.length} ${images.length === 1 ? "foto" : "fotos"}` : null,
      badgeTone: "bg-[#514ddd] text-white",
      buttonTone: "bg-[#514ddd] hover:bg-[#4542ca]",
      footer: <span className="text-xs text-[#0b6b5c]">Calidad recomendada: alta resolución</span>,
      extra: (
        <div className="flex gap-3">
          {(images ?? []).slice(0, 3).map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img key={image.id} src={image.image_url} alt="" className="size-16 rounded-xl object-cover" />
          ))}
          <Link
            href="/restaurant/gallery"
            className="flex size-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c9cdf4] bg-[#f3f5ff] text-[11px] font-bold text-[#514ddd]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Subir
          </Link>
        </div>
      ),
    },
    {
      href: "/restaurant/products",
      label: "Carta y productos",
      description: "Gestiona tu carta individual.",
      icon: UtensilsCrossed,
      tag: "Menú digital",
      action: "Ver productos",
      headerTone: "bg-[linear-gradient(135deg,#17243d,#5d6d8f)]",
      headerImage: products.find((item) => item.image_url)?.image_url ?? null,
      badge: catalog ? `${products.length} ${products.length === 1 ? "ítem" : "ítems"} en carta` : null,
      badgeTone: "bg-[#0b6b5c] text-white",
      buttonTone: "bg-[#514ddd] hover:bg-[#4542ca]",
      footer: catalog && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0b6b5c]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0b6b5c]" />
          {availableProducts} disponibles hoy
        </span>
      ),
      extra: products.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {products.slice(0, 4).map((item) => (
            <span key={item.id} className="rounded-lg bg-[#eef0ff] px-3 py-1.5 text-xs font-semibold text-[#26344d]">
              {item.name} • {formatCop(item.price)}
            </span>
          ))}
        </div>
      ),
    },
    {
      href: "/restaurant/combos",
      label: "Combos y promociones",
      description: "Arma combos unitarios o compuestos.",
      icon: Package,
      tag: "Tráfico promocional",
      action: "Crear o editar combos",
      headerTone: "bg-[linear-gradient(135deg,#a30f35,#f08a9c)]",
      headerImage: combos.find((item) => item.image_url)?.image_url ?? null,
      badge: catalog ? `${activeCombos.length} ${activeCombos.length === 1 ? "activo" : "activos"}` : null,
      badgeTone: "bg-[#d6154a] text-white",
      buttonTone: "bg-[#d6154a] hover:bg-[#b8113f]",
      footer: <span className="text-xs text-[#6d6e7a]">Aparecen en Experiencias del momento</span>,
      extra: combos.length > 0 && (
        <ul className="space-y-2">
          {combos.slice(0, 2).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f3f5ff] px-4 py-2.5 text-sm font-semibold">
              <span className="truncate">{item.name}</span>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                  item.is_available ? "bg-[#c6f7f0] text-[#0b6b5c]" : "bg-[#e9e9ef] text-[#6d6e7a]"
                }`}
              >
                {item.is_available ? "ACTIVO" : "PAUSADO"}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {profile && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 rounded-full bg-[#c6f7f0] px-4 py-1.5 text-xs font-bold text-[#0b6b5c]">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#0b6b5c]" />
            Perfil público sincronizado
          </span>
          {profile.status === "APPROVED" && (
            <Link
              href={`/establishments/${profile.id}`}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#514ddd] shadow-[0_4px_14px_rgba(23,36,61,0.06)] hover:bg-[#f3f5ff]"
            >
              <Eye aria-hidden="true" className="size-4" />
              Previsualizar cómo te ven los clientes
            </Link>
          )}
        </div>
      )}

      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -bottom-20 -right-10 size-72 rounded-full bg-[#5df0dc]/30 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">
            Panel de control general
            {profile && <span className="font-medium normal-case tracking-normal text-[#6d6e7a]"> • Cúcuta</span>}
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {managerFirstName ? `¡Hola de nuevo, ${managerFirstName}!` : "Bienvenido"}
          </h1>
          <p className="text-2xl font-bold text-[#514ddd]">{profile?.name ?? "Tu restaurante"}</p>
          <div className="flex flex-wrap items-center gap-2">
            {profile && (
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[profile.status]}`}>
                <BadgeCheck aria-hidden="true" className="size-3.5" />
                {profile.status === "APPROVED" ? "Establecimiento verificado y activo" : ESTABLISHMENT_STATUS_LABEL[profile.status]}
              </span>
            )}
            {profile && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-semibold text-[#26344d]">
                <MapPin aria-hidden="true" className="size-3.5 text-[#514ddd]" />
                {profile.category} • {profile.address}
              </span>
            )}
          </div>
          <p className="max-w-xl text-base text-[#6d6e7a]">Desde aquí administras la información que verán tus clientes.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ icon: Icon, tone, value, label, hint }) => (
          <div key={label} className={`${card} p-5`}>
            <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold sm:text-4xl">{value}</p>
            <p className="mt-1 text-sm font-bold">{label}</p>
            <p className="text-xs text-[#6d6e7a]">{hint}</p>
          </div>
        ))}
      </div>

      <section className="space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#514ddd]">Gestión operativa</p>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Módulos de administración</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.href} className={`${card} flex flex-col overflow-hidden`}>
                <div className={`relative flex h-40 items-end justify-between gap-3 p-5 ${module.headerTone}`}>
                  {module.headerImage && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={module.headerImage} alt="" className="absolute inset-0 size-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#17243d]">
                    <Icon aria-hidden="true" className="size-3.5" />
                    {module.tag}
                  </span>
                  <h3 className="relative text-2xl font-extrabold text-white">{module.label}</h3>
                  {module.badge && (
                    <span className={`relative shrink-0 rounded-md px-2.5 py-1 text-xs font-bold ${module.badgeTone}`}>{module.badge}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <p className="text-base leading-relaxed text-[#43506a]">{module.description}</p>
                  {module.extra}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef0f8] pt-4">
                    {module.footer}
                    <Link
                      href={module.href}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white ${module.buttonTone}`}
                    >
                      {module.action}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
