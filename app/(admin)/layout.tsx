"use client";

import { ClipboardCheck, Flag, History, LayoutDashboard, MessageSquare, Settings, Store, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import AreaTopBar from "@/components/common/AreaTopBar";
import BottomTabBar, { type TabItem } from "@/components/common/BottomTabBar";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";
import { ADMIN_COUNTS_CHANGED, getAdminDashboard } from "@/lib/admin-api";

const REPORTS_PATH = "/admin/reports";
const PENDING_PATH = "/admin/requests";
const SETTINGS_PATH = "/admin/settings";

// `count` indica qué contador del dashboard se muestra junto al ítem.
const NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon; count?: "pending" | "reports" }> = [
  { href: "/admin/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/establishments", label: "Establecimientos", icon: Store },
  { href: PENDING_PATH, label: "Solicitudes", icon: ClipboardCheck, count: "pending" },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/reviews", label: "Reseñas", icon: MessageSquare },
  { href: REPORTS_PATH, label: "Reportes", icon: Flag, count: "reports" },
  { href: "/admin/activity", label: "Actividad", icon: History },
  { href: SETTINGS_PATH, label: "Configuración", icon: Settings },
];

// Barra inferior móvil (la barra lateral solo se ve desde md).
const TAB_ITEMS: TabItem[] = [
  { label: "Resumen", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Locales", icon: Store, href: "/admin/establishments" },
  { label: "Usuarios", icon: Users, href: "/admin/users" },
  { label: "Reseñas", icon: MessageSquare, href: "/admin/reviews" },
  { label: "Reportes", icon: Flag, href: REPORTS_PATH },
];

// Consola administrativa: solo para usuarios con rol "admin".
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // La sesión viene del AuthProvider (una sola consulta para toda la app).
  const { user, isLoading, refresh, suspended } = useAuth();
  const isAllowed = user?.role === "admin";
  // Contadores del menú (solicitudes pendientes y reportes abiertos): se recargan al navegar y cuando una
  // página avisa con ADMIN_COUNTS_CHANGED.
  const [counts, setCounts] = useState({ pending: 0, reports: 0 });

  useEffect(() => {
    if (!isAllowed) return;
    let cancelled = false;
    const load = () => {
      getAdminDashboard()
        .then((data) => {
          if (!cancelled && data) setCounts({ pending: data.pending_establishments, reports: data.open_reports });
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener(ADMIN_COUNTS_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_COUNTS_CHANGED, load);
    };
  }, [isAllowed, pathname]);

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
    if (isLoading || suspended) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      window.alert("No tienes permisos para acceder a la consola administrativa.");
      router.replace("/");
    }
  }, [user, isLoading, router, suspended]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-[#6d6e7a]">
        Verificando permisos...
      </main>
    );
  }

  const currentSection = NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  const currentLabel = currentSection?.label ?? "Resumen";

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#17243d] md:flex-row">
      <aside className="hidden border-r border-[#e4e6f0] bg-white p-3 md:sticky md:top-0 md:block md:h-dvh md:w-48 md:shrink-0 md:self-start md:overflow-y-auto lg:w-52 xl:w-60 xl:p-5">
        <div className="flex items-center gap-2">
          <BrandMark compact />
          <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-[#514ddd] xl:text-xl">PlanATi</span>
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-[#4c4cdd]">Admin</span>
        </div>

        <nav aria-label="Administración" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, count: countKey }) => {
            const isActive = currentSection?.href === href;
            const count = countKey ? counts[countKey] : 0;
            const className = `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive ? "bg-[#514ddd] text-white shadow-[0_6px_16px_rgba(81,77,221,0.25)]" : "text-[#43506a] hover:bg-[#f3f5fb]"
            }`;
            const content = (
              <>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    aria-label={`${count} ${countKey === "reports" ? "abiertos" : "pendientes"}`}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? "bg-white/25 text-white" : "bg-[#d6154a] text-white"}`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </>
            );
            return (
              <Link key={label} href={href} aria-current={isActive ? "page" : undefined} className={className}>
                {content}
              </Link>
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
          userLinks={[
            { href: PENDING_PATH, label: "Solicitudes pendientes" },
            { href: SETTINGS_PATH, label: "Configuración" },
            { href: "/admin/activity", label: "Bitácora de actividad" },
            { href: "/", label: "Ir al sitio" },
          ]}
        />
        <section className="mx-auto w-full min-w-0 max-w-[96rem] flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-6 xl:px-8">{children}</section>
      </div>

      <BottomTabBar items={TAB_ITEMS} label="Navegación de administración" />
    </div>
  );
}
