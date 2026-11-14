import { MapPinOff } from "lucide-react";
import type { ReactNode } from "react";

type MapUnavailableProps = {
  // "missing-key": no hay NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; "load-error": Google Maps no cargó.
  reason?: "missing-key" | "load-error";
  className?: string;
  // Alternativa útil debajo del aviso (p. ej. el enlace externo a Google Maps).
  children?: ReactNode;
  compact?: boolean;
};

const MESSAGES = {
  "missing-key": {
    title: "El mapa no está disponible",
    body: "Puedes seguir usando la lista y abrir las ubicaciones en Google Maps.",
  },
  "load-error": {
    title: "No pudimos cargar el mapa",
    body: "Revisa tu conexión y recarga la página. Mientras tanto, la lista sigue funcionando.",
  },
} as const;

// Estado del mapa sin clave de Google Maps o con error de carga. La app sigue funcionando sin él.
// Nunca muestra la clave ni detalles del error.
export default function MapUnavailable({ reason = "missing-key", className = "", children, compact = false }: MapUnavailableProps) {
  const message = MESSAGES[reason];
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#e9edff,#f1f3fb)] px-5 text-center ${
        compact ? "py-6" : "py-10"
      } ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#514ddd] shadow">
        <MapPinOff aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm font-semibold text-[#26344d]">{message.title}</p>
      <p className="max-w-xs text-xs text-[#6d6e7a]">{message.body}</p>
      {children}
    </div>
  );
}
