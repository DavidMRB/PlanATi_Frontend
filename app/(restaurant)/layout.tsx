"use client";

import { Images, LayoutDashboard, Package, Store, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import BrandMark from "@/components/ui/BrandMark";
import LogoutButton from "@/components/common/LogoutButton";
import { ApiError, AUTH_ENDPOINTS, getAuthRequest, type UserProfile } from "@/lib/auth-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import { getRestaurantStatus, type EstablishmentStatus, type RestaurantStatus } from "@/lib/restaurant-api";

const STATUS_PATH = "/restaurant/status";
const DASHBOARD_PATH = "/restaurant/dashboard";

const NAV_ITEMS = [
  { href: DASHBOARD_PATH, label: "Inicio", icon: LayoutDashboard },
  { href: "/restaurant/profile", label: "Perfil", icon: Store },
  { href: "/restaurant/gallery", label: "Fotos", icon: Images },
  { href: "/restaurant/products", label: "Productos", icon: UtensilsCrossed },
  { href: "/restaurant/combos", label: "Combos", icon: Package },
];

type AccessState = "checking" | "granted" | "error";

// Protege todo el panel del restaurante: solo rol "restaurant" y cuenta APPROVED
// entran al panel. Las cuentas PENDING/REJECTED solo ven /restaurant/status.
export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [restaurant, setRestaurant] = useState<RestaurantStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      try {
        const user = await getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile);
        if (cancelled) return;
        if (user?.role !== "restaurant") {
          router.replace("/");
          return;
        }

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
  }, [pathname, router]);

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

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#17243d] md:flex-row">
      <aside className="border-b border-[#e4e6f0] bg-white p-5 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between md:block md:space-y-6">
          <BrandMark compact />
          <div className="space-y-1 md:space-y-2">
            <p className="truncate text-sm font-bold">{restaurant?.name}</p>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[status]}`}
            >
              {ESTABLISHMENT_STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-[#eef2ff] text-[#4c4cdd]" : "text-[#6d6e7a] hover:bg-[#f3f5fb]"
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <LogoutButton className="mt-6 w-full justify-start" />
      </aside>

      <section className="flex-1 p-5 sm:p-8">{children}</section>
    </div>
  );
}
