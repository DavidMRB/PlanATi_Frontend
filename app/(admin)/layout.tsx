"use client";

import { LayoutDashboard, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import LogoutButton from "@/components/common/LogoutButton";
import BrandMark from "@/components/ui/BrandMark";
import { ApiError, AUTH_ENDPOINTS, getAuthRequest, type UserProfile } from "@/lib/auth-api";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/establishments", label: "Establecimientos", icon: Store },
];

// Consola administrativa: solo para usuarios con rol "admin".
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      try {
        const user = await getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile);
        if (cancelled) return;
        if (user?.role !== "admin") {
          window.alert("No tienes permisos para acceder a la consola administrativa.");
          router.replace("/");
          return;
        }
        setIsAllowed(true);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        window.alert("No fue posible verificar tus permisos.");
        router.replace("/");
      }
    };

    void guard();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-[#6d6e7a]">
        Verificando permisos...
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#17243d] md:flex-row">
      <aside className="border-b border-[#e4e6f0] bg-white p-5 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between md:block md:space-y-6">
          <BrandMark compact />
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-[#4c4cdd]">Admin</span>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
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
