"use client";

import { ClipboardCheck, LayoutDashboard, MessageSquare, Settings, Store, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import AreaTopBar from "@/components/common/AreaTopBar";
import BottomTabBar, { type TabItem } from "@/components/common/BottomTabBar";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";
import PlaceholderLink from "@/components/ui/PlaceholderLink";

// Sin href el ítem es un PlaceholderLink: la sección del diseño todavía no existe.
const NAV_ITEMS: Array<{ href?: string; label: string; icon: LucideIcon }> = [
  { href: "/admin/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/establishments", label: "Establecimientos", icon: Store },
  { label: "Solicitudes", icon: ClipboardCheck },
  { label: "Usuarios", icon: Users },
  { label: "Reseñas", icon: MessageSquare },
  { label: "Configuración", icon: Settings },
];

// Barra inferior móvil (la barra lateral solo se ve desde md).
const TAB_ITEMS: TabItem[] = [
  { label: "Resumen", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Solicitudes", icon: ClipboardCheck },
  { label: "Locales", icon: Store, href: "/admin/establishments" },
  { label: "Ajustes", icon: Settings },
];

// Consola administrativa: solo para usuarios con rol "admin".
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // La sesión viene del AuthProvider (una sola consulta para toda la app).
  const { user, isLoading, refresh } = useAuth();
  const isAllowed = user?.role === "admin";

  // Revalida la sesión contra la API al entrar y en cada cambio de ruta, como hacía el guard original:
  // si la cookie venció (401) el contexto pasa a null y el efecto de abajo redirige a /login.
  // Se omite la primera consulta cuando el proveedor todavía está haciendo la carga inicial.
  const mountedWhileLoading = useRef(isLoading);
  const checkedPath = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading) return;
    if (checkedPath.current === null) {
      checkedPath.current = pathname;
      if (mountedWhileLoading.current) return;
    } else if (checkedPath.current === pathname) {
      return;
    } else {
      checkedPath.current = pathname;
    }
    void refresh();
  }, [pathname, isLoading, refresh]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      window.alert("No tienes permisos para acceder a la consola administrativa.");
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-[#6d6e7a]">
        Verificando permisos...
      </main>
    );
  }

  const currentLabel = NAV_ITEMS.find((item) => item.href && pathname.startsWith(item.href))?.label ?? "Resumen";

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#17243d] md:flex-row">
      <aside className="hidden border-r border-[#e4e6f0] bg-white p-5 md:block md:w-64 md:shrink-0">
        <div className="flex items-center gap-2">
          <BrandMark compact />
          <span className="text-xl font-extrabold tracking-tight text-[#514ddd]">PlanATi</span>
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-[#4c4cdd]">Admin</span>
        </div>

        <nav aria-label="Administración" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href ? pathname.startsWith(href) : false;
            const className = `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive ? "bg-[#514ddd] text-white shadow-[0_6px_16px_rgba(81,77,221,0.25)]" : "text-[#43506a] hover:bg-[#f3f5fb]"
            }`;
            const content = (
              <>
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </>
            );
            return href ? (
              <Link key={label} href={href} aria-current={isActive ? "page" : undefined} className={className}>
                {content}
              </Link>
            ) : (
              <PlaceholderLink key={label} className={className}>
                {content}
              </PlaceholderLink>
            );
          })}
        </nav>

        <LogoutButton className="mt-6 w-full justify-start" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AreaTopBar
          badge="Admin"
          portal="Panel de Administración"
          current={currentLabel}
          userSubtitle="Administrador"
          userLinks={[{ href: "/", label: "Ir al sitio" }]}
        />
        <section className="flex-1 p-5 sm:p-8">{children}</section>
      </div>

      <BottomTabBar items={TAB_ITEMS} label="Navegación de administración" />
    </div>
  );
}
