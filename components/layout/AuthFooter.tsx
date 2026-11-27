"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AuthFooter({ fallback }: { fallback: ReactNode }) {
  const pathname = usePathname();

  if (pathname !== "/login") return fallback;

  return (
    <footer className="bg-[#f8f9ff] px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-xs text-[#596175] xl:bg-[linear-gradient(90deg,#eef4ff,#e8fbfa)]">
      <nav aria-label="Información legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/legal/terms" className="inline-flex min-h-8 items-center hover:text-[#4c4cdd] hover:underline">
          Términos de servicio
        </Link>
        <span aria-hidden="true" className="hidden sm:inline">•</span>
        <Link href="/legal/privacy" className="inline-flex min-h-8 items-center hover:text-[#4c4cdd] hover:underline">
          Política de privacidad
        </Link>
        <span aria-hidden="true" className="hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#0b6b5c]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Cúcuta Segura
        </span>
      </nav>
    </footer>
  );
}
