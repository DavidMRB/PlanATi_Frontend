"use client";

import { Clock, Images, LayoutDashboard, LifeBuoy, Package, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import AreaTopBar from "@/components/common/AreaTopBar";
import BottomTabBar, { type TabItem } from "@/components/common/BottomTabBar";
import BrandMark from "@/components/ui/BrandMark";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import PlaceholderLink from "@/components/ui/PlaceholderLink";
import { ApiError } from "@/lib/auth-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import { getRestaurantStatus, type EstablishmentStatus, type RestaurantStatus } from "@/lib/restaurant-api";

const STATUS_PATH = "/restaurant/status";
const DASHBOARD_PATH = "/restaurant/dashboard";

// Sin href el ítem es un PlaceholderLink: la sección del diseño todavía no existe.
const NAV_ITEMS: Array<{ href?: string; label: string; icon: LucideIcon }> = [
  { href: DASHBOARD_PATH, label: "Panel Principal", icon: LayoutDashboard },
  { href: "/restaurant/profile", label: "Perfil de Comercio", icon: Store },
  { href: "/restaurant/products", label: "Menú y Productos", icon: UtensilsCrossed },
  { href: "/restaurant/combos", label: "Combos y Promociones", icon: Package },
  { href: "/restaurant/gallery", label: "Galería y Fotos", icon: Images },
  { label: "Horarios", icon: Clock },
  { label: "Soporte", icon: LifeBuoy },
];

// Barra inferior móvil (la barra lateral solo se ve desde md).
const TAB_ITEMS: TabItem[] = [
  { label: "Panel", icon: LayoutDashboard, href: DASHBOARD_PATH },
  { label: "Mi Menú", icon: UtensilsCrossed, href: "/restaurant/products" },
  { label: "Fotos", icon: Images, href: "/restaurant/gallery" },
  { label: "Combos", icon: Package, href: "/restaurant/combos" },
  { label: "Perfil", icon: Store, href: "/restaurant/profile" },
];

type AccessState = "checking" | "granted" | "error";

// Protege todo el panel del restaurante: solo rol "restaurant" y cuenta APPROVED
// entran al panel. Las cuentas PENDING/REJECTED solo ven /restaurant/status.
export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // La sesión viene del AuthProvider (una sola consulta para toda la app).
  const { user, isLoading: isSessionLoading } = useAuth();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [restaurant, setRestaurant] = useState<RestaurantStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const role = user?.role;

  useEffect(() => {
    if (isSessionLoading) return;
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role !== "restaurant") {
      router.replace("/");
      return;
    }

    let cancelled = false;

    const guard = async () => {
      try {
        const status = await getRestaurantStatus();
        if (cancelled) return;
        if (!status) {
          throw new Error("No se recibió el estado de tu establecimiento.");
        }

        const isApproved = status.status === "APPROVED";
        if (!isApproved && pathname !== STATUS_PATH) {
          router.replace(STATUS_PATH);
          return;
        }
        if (isApproved && pathname === STATUS_PATH) {
          router.replace(DASHBOARD_PATH);
          return;
        }

        setRestaurant(status);
        setAccessState("granted");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          router.replace(STATUS_PATH);
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "No fue posible verificar tu cuenta.");
        setAccessState("error");
      }
    };

    void guard();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, isSessionLoading, role]);

  if (accessState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-[#6d6e7a]">
        Verificando tu cuenta...
      </main>
    );
  }

  if (accessState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-center text-sm text-red-600">
        {errorMessage}
      </main>
    );
  }

  if (pathname === STATUS_PATH) {
    return <>{children}</>;
  }

  const status: EstablishmentStatus = restaurant?.status ?? "PENDING";

  const currentLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Panel Principal";

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#17243d] md:flex-row">
      <aside className="hidden border-r border-[#e4e6f0] bg-white p-5 md:block md:w-64 md:shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BrandMark compact />
            <div className="leading-tight">
              <p className="text-xl font-extrabold tracking-tight text-[#514ddd]">PlanATi</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0b6b5c]">Aliados</p>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl bg-[#eef2ff] p-4">
            <p className="truncate text-sm font-bold">{restaurant?.name}</p>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[status]}`}
            >
              {ESTABLISHMENT_STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        <nav aria-label="Panel del restaurante" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href ? pathname === href : false;
            const className = `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive ? "bg-[#514ddd] text-white shadow-[0_6px_16px_rgba(81,77,221,0.25)]" : "text-[#43506a] hover:bg-[#f3f5fb]"
            }`;
            const content = (
              <>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
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
          badge="Aliados"
          portal="Portal de Aliados"
          current={currentLabel}
          userSubtitle={restaurant?.name}
          userLinks={[
            { href: "/", label: "Ir al sitio" },
            ...(restaurant ? [{ href: `/establishments/${restaurant.establishment_id}`, label: "Ver mi ficha pública" }] : []),
          ]}
          status={
            status === "APPROVED" ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-[#c6f7f0] px-3 py-1 text-xs font-bold text-[#0b6b5c] sm:flex">
                <span aria-hidden="true" className="size-2 rounded-full bg-[#0b6b5c]" />
                En directo
              </span>
            ) : null
          }
        />
        <section className="flex-1 p-5 sm:p-8">{children}</section>
      </div>

      <BottomTabBar items={TAB_ITEMS} label="Navegación del restaurante" />
    </div>
  );
}
