"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import LogoutButton from "@/components/common/LogoutButton";
import { useDismiss } from "@/components/common/useDismiss";
import { useAuth } from "@/components/providers/AuthProvider";
import Avatar from "@/components/ui/Avatar";

export type MenuLink = { href: string; label: string };

// Enlace al área de cada rol; se muestra en el menú del avatar del sitio público.
const ROLE_LINK: Record<string, MenuLink> = {
  admin: { href: "/admin/dashboard", label: "Panel admin" },
  restaurant: { href: "/restaurant/dashboard", label: "Mi establecimiento" },
  user: { href: "/profile", label: "Mi perfil" },
};

type UserMenuProps = {
  // Texto bajo el nombre (rol o nombre del local).
  subtitle?: string;
  // Reemplaza los enlaces del menú; por defecto, el área del rol del usuario.
  links?: MenuLink[];
};

// Avatar con nombre que abre un menú con el enlace a su área y "Cerrar sesión".
export default function UserMenu({ subtitle, links }: UserMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);

  if (!user) return null;

  const roleLink = ROLE_LINK[user.role];
  const items = links ?? (roleLink ? [roleLink] : []);
  const name = user.nickname ?? user.full_name;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[#f3f5fb] lg:pr-3"
      >
        <Avatar user={user} className="size-9" />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block max-w-[10rem] truncate text-sm font-bold text-[#17243d]">{name}</span>
          {subtitle && <span className="block max-w-[10rem] truncate text-xs text-[#6d6e7a]">{subtitle}</span>}
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-4 text-[#81869a] lg:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(23,36,61,0.18)] ring-1 ring-[#e4e6f0]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-[#17243d]">{user.full_name}</p>
            <p className="truncate text-xs text-[#6d6e7a]">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-[#eef0f8]" />
          {items.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#26344d] hover:bg-[#f3f5fb] hover:text-[#514ddd]"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton className="w-full justify-start" />
        </div>
      )}
    </div>
  );
}
