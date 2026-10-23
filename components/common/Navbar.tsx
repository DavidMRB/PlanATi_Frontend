"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import { AUTH_ENDPOINTS, getAuthRequest, type UserProfile } from "@/lib/auth-api";
import LogoutButton from "@/components/common/LogoutButton";

type NavLink = { href: string; label: string };

// Los enlaces dependen del rol: el visitante anónimo ve solo el directorio y el login.
function linksForRole(role: string | null | undefined): NavLink[] {
  const publicLinks: NavLink[] = [{ href: "/explore", label: "Explorar" }];

  if (role === "admin") return [...publicLinks, { href: "/admin/dashboard", label: "Panel admin" }];
  if (role === "restaurant") return [...publicLinks, { href: "/restaurant/dashboard", label: "Mi restaurante" }];
  if (role === "user") return [...publicLinks, { href: "/profile", label: "Mi perfil" }];
  return publicLinks;
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile)
      .then((profile) => {
        if (!cancelled) setUser(profile ?? null);
      })
      .catch(() => {
        // Sin sesión (401) o backend caído: se muestra la navegación de visitante.
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const links = linksForRole(user?.role);
  const isLoading = user === undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e6f0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" aria-label="Inicio">
          <BrandMark />
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold text-[#6d6e7a]">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 hover:bg-[#f3f5fb] hover:text-[#4c4cdd]">
              {link.label}
            </Link>
          ))}

          {!isLoading && !user && (
            <Link href="/login" className="ml-2 rounded-xl bg-[#514ddd] px-4 py-2 text-white hover:bg-[#4542ca]">
              Iniciar sesión
            </Link>
          )}

          {user && (
            <>
              <span className="ml-2 hidden px-2 text-[#17243d] sm:inline">{user.nickname ?? user.full_name}</span>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
