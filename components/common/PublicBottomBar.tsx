"use client";

import { CalendarDays, Compass, Heart, House, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import BottomTabBar, { type TabItem } from "@/components/common/BottomTabBar";
import { useAuth } from "@/components/providers/AuthProvider";

// Dónde lleva "Perfil" según el rol (sin sesión, al login).
const PROFILE_BY_ROLE: Record<string, { href: string; match: (pathname: string) => boolean }> = {
  user: { href: "/profile", match: (pathname) => pathname.startsWith("/profile") },
  restaurant: { href: "/restaurant/dashboard", match: (pathname) => pathname.startsWith("/restaurant") },
  admin: { href: "/admin/dashboard", match: (pathname) => pathname.startsWith("/admin") },
};

// Barra inferior móvil del sitio público.
export default function PublicBottomBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  // En móvil el detalle del establecimiento tiene su propia barra de acciones.
  if (pathname.startsWith("/establishments/")) return null;
  // El asistente de planes usa la barra inferior para el total y el botón de avanzar.
  if (pathname === "/plans/new" || /^\/plans\/[^/]+\/edit$/.test(pathname)) return null;

  const profile = (user && PROFILE_BY_ROLE[user.role]) || { href: "/login", match: (path: string) => path.startsWith("/login") };

  const items: TabItem[] = [
    { label: "Inicio", icon: House, href: "/", match: (path) => path === "/" },
    { label: "Explorar", icon: Compass, href: "/explore", match: (path) => path.startsWith("/explore") },
    // Planes y favoritos son de cuentas `user`; sin sesión, el enlace lleva al login.
    ...(!user || user.role === "user"
      ? [
          { label: "Planes", icon: CalendarDays, href: "/plans", match: (path: string) => path.startsWith("/plans") },
          { label: "Favoritos", icon: Heart, href: "/favorites", match: (path: string) => path.startsWith("/favorites") },
        ]
      : []),
    { label: "Perfil", icon: UserRound, href: profile.href, match: profile.match },
  ];

  return <BottomTabBar items={items} label="Navegación principal" />;
}
