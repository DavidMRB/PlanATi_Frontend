import { ShieldAlert } from "lucide-react";
import Link from "next/link";

const DEFAULT_NOTICE = "El comentario fue bloqueado por una violación a las políticas de la aplicación.";

// Sustituye el texto de un comentario o respuesta bloqueados. Solo muestra el aviso del backend:
// nunca intenta mostrar el texto original (la vista pública ni siquiera lo recibe).
export default function BlockedContentNotice({ notice }: { notice?: string | null }) {
  return (
    <p className="flex flex-wrap items-start gap-x-2 gap-y-1 rounded-xl bg-[#f1f2f6] px-4 py-3 text-sm text-[#5b6175]">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#6d6e7a]" />
      <em className="min-w-0 flex-1">{notice || DEFAULT_NOTICE}</em>
      <Link href="/legal/community-guidelines" className="text-xs font-semibold text-[#514ddd] hover:underline">
        Ver normas de la comunidad
      </Link>
    </p>
  );
}
