"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import EstablishmentSearch from "@/components/establishments/EstablishmentSearch";
import NotificationsBell from "@/components/common/NotificationsBell";
import UserMenu from "@/components/common/UserMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";
import PlaceholderLink from "@/components/ui/PlaceholderLink";

type NavLink = {
  label: string;
  // Sin href el enlace es un PlaceholderLink (la sección aún no existe).
  href?: string;
  match?: (pathname: string) => boolean;
};

const LINKS: NavLink[] = [
  { label: "Inicio", href: "/", match: (pathname) => pathname === "/" },
  {
    label: "Explorar",
    href: "/explore",
    match: (pathname) => pathname.startsWith("/explore") || pathname.startsWith("/establishments"),
  },
  { label: "Planes", href: "/plans", match: (pathname) => pathname.startsWith("/plans") },
  { label: "Mis Favoritos", href: "/favorites", match: (pathname) => pathname.startsWith("/favorites") },
];

// Planes y favoritos son de cuentas `user`: se ocultan a restaurantes y admins (sin sesión, llevan al login).
const USER_ONLY = new Set(["/plans", "/favorites"]);

// Se monta una sola vez en el layout de las páginas del sitio (app/(site)/layout.tsx); la sesión viene del
// AuthProvider, así que no consulta la API por su cuenta. El rol solo decide el menú del avatar.
// Desde md se usa esta misma barra (tablet y escritorio); en móvil se complementa con PublicBottomBar.
export default function Navbar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // En móvil el detalle del establecimiento deja la portada a pantalla completa y usa su propio enlace "Explorar".
  const hiddenOnMobile = pathname.startsWith("/establishments/") || pathname === "/plans/new";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-[#e4e6f0] bg-white/90 backdrop-blur ${hiddenOnMobile ? "hidden md:block" : ""}`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 md:h-[4.5rem] lg:gap-6">
        <Link href="/" aria-label="PlanATi, inicio" className="flex shrink-0 items-center gap-2">
          <BrandMark compact />
          <span className="text-xl font-extrabold tracking-tight text-[#514ddd]">PlanATi</span>
        </Link>

        <EstablishmentSearch className="hidden min-w-0 flex-1 lg:block lg:max-w-md" />

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 text-sm font-semibold md:flex">
          {LINKS.filter(({ href }) => !(USER_ONLY.has(href ?? "") && user && user.role !== "user")).map(({ label, href, match }) => {
            const isActive = href ? (match ? match(pathname) : pathname === href) : false;
            const className = `rounded-lg px-3 py-2 transition ${
              isActive
                ? "bg-[#514ddd] text-white shadow-sm"
                : "text-[#26344d] hover:bg-[#f3f5fb] hover:text-[#514ddd]"
            }`;
            return href ? (
              <Link key={label} href={href} aria-current={isActive ? "page" : undefined} className={className}>
                {label}
              </Link>
            ) : (
              <PlaceholderLink key={label} className={className}>
                {label}
              </PlaceholderLink>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 md:border-l md:border-[#e4e6f0] md:pl-4">
          {user && <NotificationsBell />}
          {user && <UserMenu />}
          {!isLoading && !user && (
            <Link href="/login" className="rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4542ca]">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
