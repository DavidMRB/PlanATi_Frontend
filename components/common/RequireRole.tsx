"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { UserProfile } from "@/lib/auth-api";

type Role = "user" | "restaurant" | "admin";

// Panel de cada rol cuando entra a una página que no le corresponde.
const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  restaurant: "/restaurant/dashboard",
  user: "/",
};

type RequireRoleProps = {
  roles: Role[];
  // Para `user`: exigir el teléfono verificado (si no, va a /complete-profile).
  requireVerifiedPhone?: boolean;
  children: ReactNode;
  // Lo que se ve mientras se consulta la sesión o se redirige.
  fallback?: ReactNode;
};

function redirectFor(
  user: UserProfile | null,
  roles: Role[],
  requireVerifiedPhone: boolean,
  currentPath: string,
): string | null {
  if (!user) return `/login?redirect=${encodeURIComponent(currentPath)}`;
  if (!roles.includes(user.role as Role)) return ROLE_HOME[user.role] ?? "/";
  if (requireVerifiedPhone && user.role === "user" && !user.phone_verified) return "/complete-profile";
  return null;
}

// Protege una página por rol en el cliente (proxy.ts solo comprueba que exista la cookie).
// La autorización real la hace siempre el backend.
export default function RequireRole({ roles, requireVerifiedPhone = false, children, fallback }: RequireRoleProps) {
  const { user, isLoading, suspended } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Con la cuenta suspendida, AuthProvider ya lleva a /account-suspended: no se manda al login.
  const destination =
    isLoading || (suspended && !user) ? null : redirectFor(user ?? null, roles, requireVerifiedPhone, pathname);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (isLoading || destination) {
    return (
      fallback ?? (
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e6eaff]" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl bg-[#eef0ff]" />
        </div>
      )
    );
  }

  return <>{children}</>;
}
