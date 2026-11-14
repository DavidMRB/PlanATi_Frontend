import { BedDouble, Coffee, MapPin, Martini, ShoppingBag, Sparkles, Star, Utensils, type LucideIcon } from "lucide-react";

// Color e ícono del pin por tipo de establecimiento (mismo criterio en el directorio y en el selector).
export const TYPE_VISUAL: Record<string, { color: string; icon: LucideIcon }> = {
  RESTAURANT: { color: "#514ddd", icon: Utensils },
  CAFE: { color: "#0b6b5c", icon: Coffee },
  BAR: { color: "#d6154a", icon: Martini },
  HOTEL: { color: "#17243d", icon: BedDouble },
  EXPERIENCE: { color: "#b45309", icon: Sparkles },
  STORE: { color: "#0e7490", icon: ShoppingBag },
  OTHER: { color: "#6d6e7a", icon: MapPin },
};

export function typeVisual(type: string | null | undefined) {
  return TYPE_VISUAL[type ?? ""] ?? TYPE_VISUAL.OTHER;
}

type MarkerBubbleProps = {
  type: string | null | undefined;
  // Puntuación ya formateada ("4,6") o null si no hay reseñas.
  rating?: string | null;
  // Nombre visible junto al pin (vista previa del selector de ubicación).
  label?: string;
  active?: boolean;
};

// Contenido visual del marcador. La punta inferior queda sobre el punto exacto del local.
export default function MarkerBubble({ type, rating, label, active = false }: MarkerBubbleProps) {
  const { color, icon: Icon } = typeVisual(type);

  return (
    <span
      className={`relative flex origin-bottom flex-col items-center transition-transform duration-150 ${active ? "scale-115" : ""}`}
    >
      <span
        className="flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-xs font-bold shadow-[0_4px_12px_rgba(23,36,61,0.25)] ring-2"
        style={{
          backgroundColor: active ? color : "#ffffff",
          color: active ? "#ffffff" : "#17243d",
          // ring-color via CSS variable de Tailwind
          ["--tw-ring-color" as string]: active ? "#ffffff" : color,
        }}
      >
        <span
          className="flex size-5 items-center justify-center rounded-full"
          style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : color, color: "#ffffff" }}
        >
          <Icon aria-hidden="true" className="size-3" />
        </span>
        {label ? (
          <span className="max-w-40 truncate">{label}</span>
        ) : rating ? (
          <span className="flex items-center gap-0.5">
            <Star aria-hidden="true" className="size-3 fill-current" />
            {rating}
          </span>
        ) : (
          <span className="font-semibold opacity-80">Nuevo</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="-mt-px size-0 border-x-[6px] border-t-[7px] border-x-transparent"
        style={{ borderTopColor: active ? color : "#ffffff" }}
      />
    </span>
  );
}
