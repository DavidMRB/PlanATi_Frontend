"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PlaceholderLink from "@/components/ui/PlaceholderLink";

export type TabItem = {
  label: string;
  icon: LucideIcon;
  // Sin href la pestaña es un PlaceholderLink (la sección aún no existe).
  href?: string;
  // Cuándo se marca como activa; por defecto, la ruta coincide con href o cuelga de ella.
  match?: (pathname: string) => boolean;
};

// Barra de navegación inferior para móvil (se oculta desde md): mueve entre las vistas principales de cada área.
export default function BottomTabBar({ items, label }: { items: TabItem[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e4e6f0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ label: itemLabel, icon: Icon, href, match }) => {
          const isActive = href
            ? match
              ? match(pathname)
              : pathname === href || pathname.startsWith(`${href}/`)
            : false;
          const className = `flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-semibold transition ${
            isActive ? "text-[#514ddd]" : "text-[#6d6e7a] hover:text-[#514ddd]"
          }`;
          const content = (
            <>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? "bg-[#e6eaff]" : ""}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              {itemLabel}
            </>
          );

          return (
            <li key={itemLabel} className="flex-1">
              {href ? (
                <Link href={href} aria-current={isActive ? "page" : undefined} className={className}>
                  {content}
                </Link>
              ) : (
                <PlaceholderLink className={className}>{content}</PlaceholderLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
