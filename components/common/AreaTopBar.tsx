"use client";

import type { ReactNode } from "react";
import NotificationsBell from "@/components/common/NotificationsBell";
import UserMenu, { type MenuLink } from "@/components/common/UserMenu";
import BrandMark from "@/components/ui/BrandMark";

type AreaTopBarProps = {
  // Etiqueta junto al logo en móvil (por ejemplo "Admin" o "Aliados").
  badge: string;
  // Raíz de la ruta de migas en escritorio y tablet (por ejemplo "Portal de Aliados").
  portal: string;
  // Sección actual en la ruta de migas.
  current: string;
  // Texto bajo el nombre del usuario (rol o nombre del local).
  userSubtitle?: string;
  // Elemento opcional a la derecha, antes de la campana (por ejemplo la píldora "En directo").
  status?: ReactNode;
  userLinks?: MenuLink[];
};

// Barra superior de las áreas con barra lateral (admin y restaurante). En móvil muestra el logo
// (la barra lateral se oculta y la navegación pasa a la barra inferior); desde md, la ruta de migas.
export default function AreaTopBar({ badge, portal, current, userSubtitle, status, userLinks }: AreaTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e4e6f0] bg-white/90 px-4 backdrop-blur sm:px-8 md:h-16">
      <div className="flex items-center gap-2 md:hidden">
        <BrandMark compact />
        <span className="text-lg font-extrabold tracking-tight text-[#514ddd]">PlanATi</span>
        <span className="rounded-md bg-[#e6eaff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#514ddd]">
          {badge}
        </span>
      </div>

      <nav aria-label="Ruta" className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-[#43506a]">{portal}</span>
        <span aria-hidden="true" className="text-[#c9cdf4]">
          /
        </span>
        <span className="font-semibold text-[#514ddd]">{current}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {status}
        <NotificationsBell />
        <UserMenu subtitle={userSubtitle} links={userLinks} />
      </div>
    </header>
  );
}
