"use client";

import { Bell } from "lucide-react";
import { useRef, useState } from "react";
import { useDismiss } from "@/components/common/useDismiss";

// Campana de notificaciones. El backend todavía no tiene notificaciones: la ventana pequeña muestra
// el estado vacío. Cuando existan, aquí se listan.
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-full text-[#43506a] transition hover:bg-[#f3f5fb] hover:text-[#514ddd]"
      >
        <Bell aria-hidden="true" className="size-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white p-4 shadow-[0_16px_40px_rgba(23,36,61,0.18)] ring-1 ring-[#e4e6f0]"
        >
          <p className="text-sm font-bold text-[#17243d]">Notificaciones</p>
          <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-[#f3f5ff] px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#514ddd]">
              <Bell aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-semibold text-[#26344d]">Estás al día</p>
            <p className="text-xs text-[#6d6e7a]">Aún no tienes notificaciones.</p>
          </div>
        </div>
      )}
    </div>
  );
}
