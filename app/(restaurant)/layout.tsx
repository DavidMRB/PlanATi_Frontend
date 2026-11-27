"use client";

import { Clock, Images, LayoutDashboard, LifeBuoy, MessageSquare, Package, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import AreaTopBar from "@/components/common/AreaTopBar";
import BottomTabBar, { type TabItem } from "@/components/common/BottomTabBar";
import BrandMark from "@/components/ui/BrandMark";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import PlaceholderLink from "@/components/ui/PlaceholderLink";
import { ACCOUNT_SUSPENDED_CODE, ApiError, CONSENT_REQUIRED_CODE, apiErrorCode } from "@/lib/auth-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import {
  getRestaurantReviewSummary,
  getRestaurantStatus,
  RESTAURANT_REVIEWS_CHANGED,
  type EstablishmentStatus,
  type RestaurantStatus,
} from "@/lib/restaurant-api";

const STATUS_PATH = "/restaurant/status";
const DASHBOARD_PATH = "/restaurant/dashboard";
const REVIEWS_PATH = "/restaurant/reviews";

// Sin href el ítem es un PlaceholderLink: la sección del diseño todavía no existe.
const NAV_ITEMS: Array<{ href?: string; label: string; icon: LucideIcon }> = [
  { href: DASHBOARD_PATH, label: "Panel Principal", icon: LayoutDashboard },
  { href: "/restaurant/profile", label: "Perfil de Comercio", icon: Store },
  { href: "/restaurant/products", label: "Menú y Productos", icon: UtensilsCrossed },
  { href: "/restaurant/combos", label: "Combos y Promociones", icon: Package },
  { href: "/restaurant/gallery", label: "Galería y Fotos", icon: Images },
  { href: REVIEWS_PATH, label: "Reseñas", icon: MessageSquare },
  { href: "/restaurant/schedules", label: "Horarios", icon: Clock },
  { label: "Soporte", icon: LifeBuoy },
];

// Barra inferior móvil (la barra lateral solo se ve desde md). Combos se abre desde "Menú" y Horarios desde el
// panel principal [DECISIÓN F-D2].
const TAB_ITEMS: TabItem[] = [
  { label: "Panel", icon: LayoutDashboard, href: DASHBOARD_PATH },
  {
    label: "Menú",
    icon: UtensilsCrossed,
    href: "/restaurant/products",
    match: (path) => path.startsWith("/restaurant/products") || path.startsWith("/restaurant/combos"),
  },
  { label: "Reseñas", icon: MessageSquare, href: REVIEWS_PATH },
  { label: "Fotos", icon: Images, href: "/restaurant/gallery" },
  { label: "Perfil", icon: Store, href: "/restaurant/profile" },
];

type AccessState = "checking" | "granted" | "error";

// Protege todo el panel del restaurante: solo rol "restaurant" y cuenta APPROVED
// entran al panel. Las cuentas PENDING/REJECTED solo ven /restaurant/status.
export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // La sesión viene del AuthProvider (una sola consulta para toda la app).
  const { user, isLoading: isSessionLoading, suspended } = useAuth();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [restaurant, setRestaurant] = useState<RestaurantStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  // Reseñas sin responder (contador del menú). Se recarga al navegar y cuando la página de reseñas avisa.
  const [unanswered, setUnanswered] = useState(0);
  const role = user?.role;
  const isPanel = accessState === "granted" && restaurant?.status === "APPROVED";

  useEffect(() => {
    if (!isPanel) return;
    let cancelled = false;
    const refresh = () => {
      getRestaurantReviewSummary()
        .then((summary) => {
          if (!cancelled) setUnanswered(summary?.unanswered_count ?? 0);
        })
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener(RESTAURANT_REVIEWS_CHANGED, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(RESTAURANT_REVIEWS_CHANGED, refresh);
    };
  }, [isPanel, pathname]);

  useEffect(() => {
    if (isSessionLoading) return;
    // Cuenta suspendida: AuthProvider ya redirige a /account-suspended.
    if (suspended) return;
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
        if (apiErrorCode(error) === ACCOUNT_SUSPENDED_CODE) return;
        // Política sin aceptar: ConsentGate está abierto y recarga la página al aceptar.
        if (apiErrorCode(error) === CONSENT_REQUIRED_CODE) return;
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
  }, [pathname, router, isSessionLoading, role, suspended]);

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
      <aside className="hidden border-r border-[#e4e6f0] bg-white p-3 md:sticky md:top-0 md:block md:h-dvh md:w-48 md:shrink-0 md:self-start md:overflow-y-auto lg:w-52 xl:w-60 xl:p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BrandMark compact />
            <div className="leading-tight">
              <p className="whitespace-nowrap text-lg font-extrabold tracking-tight text-[#514ddd] xl:text-xl">PlanATi</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0b6b5c]">Aliados</p>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl bg-[#eef2ff] p-4">
            <p className="break-words text-sm font-bold">{restaurant?.name}</p>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[status]}`}
            >
              {ESTABLISHMENT_STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        <nav aria-label="Panel del establecimiento" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href ? pathname === href : false;
            const className = `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive ? "bg-[#514ddd] text-white shadow-[0_6px_16px_rgba(81,77,221,0.25)]" : "text-[#43506a] hover:bg-[#f3f5fb]"
            }`;
            const count = href === REVIEWS_PATH ? unanswered : 0;
            const content = (
              <>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    aria-label={`${count} sin responder`}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? "bg-white/25 text-white" : "bg-[#d6154a] text-white"}`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
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
            { href: "/restaurant/schedules", label: "Horarios" },
            { href: "/restaurant/combos", label: "Combos y promociones" },
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
        <section className="mx-auto w-full min-w-0 max-w-[96rem] flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-6 xl:px-8">{children}</section>
      </div>

      <BottomTabBar items={TAB_ITEMS} label="Navegación del establecimiento" />
    </div>
  );
}
