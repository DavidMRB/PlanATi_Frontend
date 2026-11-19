"use client";

import { Heart, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useFavorites } from "./FavoritesProvider";

type FavoriteButtonProps = {
  establishmentId: number;
  // Nombre del lugar para el texto accesible ("Guardar Parrilla A en favoritos").
  name: string;
  // Valor mientras no llegan los ids (p. ej. `is_favorite` del detalle).
  initial?: boolean;
  // "icon": círculo sobre la foto de una tarjeta. "full": botón con texto (detalle).
  variant?: "icon" | "full";
  className?: string;
};

// Corazón de favoritos. No se muestra a restaurantes ni admins; a un visitante lo lleva al login (y de
// vuelta a esta página) y a un usuario sin teléfono verificado, a completar el perfil.
// No debe ir dentro de un <a>: las tarjetas lo ponen como hermano del enlace.
export default function FavoriteButton({ establishmentId, name, initial, variant = "icon", className = "" }: FavoriteButtonProps) {
  const { mode, isFavorite, isPending, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();

  if (mode === "loading" || mode === "none") return null;

  const active = mode === "user" && isFavorite(establishmentId, initial);
  const pending = isPending(establishmentId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (mode === "visitor") {
      router.push(`/login?redirect=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
      return;
    }
    if (mode === "unverified") {
      router.push("/complete-profile");
      return;
    }
    void toggle(establishmentId, active);
  };

  // Etiqueta fija: el estado lo anuncia aria-pressed (un botón de alternar no debe cambiar de nombre).
  const label = `Guardar ${name} en favoritos`;
  const icon = pending ? (
    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
  ) : (
    <Heart aria-hidden="true" className={`size-5 transition ${active ? "fill-[#d6154a] text-[#d6154a]" : ""}`} />
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        aria-label={label}
        disabled={pending}
        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition disabled:opacity-70 ${
          active ? "bg-[#fde0e3] text-[#a30f35] hover:bg-[#fbd0d6]" : "bg-[#eef0ff] text-[#514ddd] hover:bg-[#e2e5ff]"
        } ${className}`}
      >
        {icon}
        {active ? "En favoritos" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      disabled={pending}
      className={`flex size-9 items-center justify-center rounded-full bg-white/90 text-[#26344d] shadow-[0_4px_12px_rgba(23,36,61,0.18)] backdrop-blur transition hover:scale-105 hover:text-[#d6154a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#514ddd] disabled:opacity-70 ${className}`}
    >
      {icon}
    </button>
  );
}
