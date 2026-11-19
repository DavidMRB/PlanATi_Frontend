import { Globe, Share2 } from "lucide-react";
import Link from "next/link";
import PlaceholderLink from "@/components/ui/PlaceholderLink";

// Pie de página único para todas las vistas (se monta en app/layout.tsx). Diseño tomado de Home (escritorio).
// El padding inferior en móvil deja libre el espacio de la barra de pestañas fija.
export default function Footer() {
  return (
    <footer className="bg-[#f8f9ff] pb-24 text-[#17243d] md:pb-0">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="space-y-6 border-t border-[#d7dcf2] py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-lg font-bold text-[#514ddd]">PlanATi</p>
              <p className="text-xs text-[#43506a]">La energía de tu ciudad, conectada.</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold">
              <Link href="/legal/privacy" className="hover:text-[#514ddd]">
                Privacidad
              </Link>
              <Link href="/legal/terms" className="hover:text-[#514ddd]">
                Términos
              </Link>
              <Link href="/legal/community-guidelines" className="hover:text-[#514ddd]">
                Normas de la comunidad
              </Link>
              <PlaceholderLink className="hover:text-[#514ddd]">Nosotros</PlaceholderLink>
              <PlaceholderLink className="hover:text-[#514ddd]">Contacto</PlaceholderLink>
              <span className="flex items-center gap-4 text-[#43506a]">
                <PlaceholderLink aria-label="Idioma" className="hover:text-[#514ddd]">
                  <Globe aria-hidden="true" className="size-5" />
                </PlaceholderLink>
                <PlaceholderLink aria-label="Compartir" className="hover:text-[#514ddd]">
                  <Share2 aria-hidden="true" className="size-5" />
                </PlaceholderLink>
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-[#6d6e7a]">© {new Date().getFullYear()} PlanATi. Hecho con pasión local.</p>
        </div>
      </div>
    </footer>
  );
}
