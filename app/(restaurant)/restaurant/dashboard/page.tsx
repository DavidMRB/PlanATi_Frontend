"use client";

import { Images, Package, Store, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getRestaurantProfile, type RestaurantProfile } from "@/lib/restaurant-api";

const SHORTCUTS = [
  { href: "/restaurant/profile", label: "Editar perfil", description: "Datos comerciales, logo y portada.", icon: Store },
  { href: "/restaurant/gallery", label: "Fotos", description: "Galería del lugar y fotos del menú.", icon: Images },
  { href: "/restaurant/products", label: "Productos", description: "Gestiona tu carta individual.", icon: UtensilsCrossed },
  { href: "/restaurant/combos", label: "Combos", description: "Arma combos unitarios o compuestos.", icon: Package },
];

export default function RestaurantDashboardPage() {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);

  useEffect(() => {
    getRestaurantProfile()
      .then((data) => setProfile(data ?? null))
      .catch(() => setProfile(null));
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-[#4c4cdd]">Bienvenido</p>
        <h1 className="text-2xl font-bold">{profile?.name ?? "Tu restaurante"}</h1>
        <p className="text-sm text-[#6d6e7a]">Desde aquí administras la información que verán tus clientes.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#e4e6f0] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4c4cdd]">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{label}</span>
              <span className="block text-sm text-[#6d6e7a]">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
