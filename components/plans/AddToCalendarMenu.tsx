"use client";

import { CalendarPlus, ChevronDown, Download, ExternalLink } from "lucide-react";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useDismiss } from "@/components/common/useDismiss";
import { planGoogleCalendarUrl, planIcsUrl, type PlanDetail } from "@/lib/plans-api";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  // iPadOS se presenta como Mac con pantalla táctil.
  if (/iphone|ipad|ipod/i.test(agent) || (/macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

const noopSubscribe = () => () => {};
const serverPlatform = (): Platform => "other";
const currentOrigin = () => window.location.origin;
const serverOrigin = () => "";

// "Agregar al calendario": Google Calendar (enlace) o el .ics del backend (Apple Calendar, Outlook…).
// El orden se adapta al dispositivo. El .ics es un enlace normal y no un Blob: Safari en iPhone solo abre
// "Añadir a Calendario" con una navegación real a una respuesta text/calendar.
export default function AddToCalendarMenu({ plan, align = "left" }: { plan: PlanDetail; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, containerRef);
  const platform = useSyncExternalStore(noopSubscribe, detectPlatform, serverPlatform);
  const origin = useSyncExternalStore(noopSubscribe, currentOrigin, serverOrigin);

  const ics = planIcsUrl(plan.id);
  const google = {
    key: "google",
    label: "Google Calendar",
    icon: ExternalLink,
    href: planGoogleCalendarUrl(plan, origin ? `${origin}/plans/${plan.id}` : undefined),
    external: true,
  };
  const apple = { key: "apple", label: "iPhone / Apple Calendar", icon: Download, href: ics, external: false };
  const outlook = { key: "outlook", label: "Outlook u otro calendario", icon: Download, href: ics, external: false };
  const options = platform === "ios" ? [apple, google, outlook] : [google, apple, outlook];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2 rounded-xl border border-[#d7dcf2] bg-white px-4 text-sm font-semibold text-[#514ddd] transition hover:bg-[#f3f5ff]"
      >
        <CalendarPlus aria-hidden="true" className="size-4" />
        Agregar al calendario
        <ChevronDown aria-hidden="true" className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-2 shadow-[0_18px_50px_rgba(38,47,99,0.2)] ring-1 ring-[#eceef7] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map(({ key, label, icon: Icon, href, external }) => (
            <a
              key={key}
              role="menuitem"
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#26344d] hover:bg-[#f3f5ff] hover:text-[#514ddd]"
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </a>
          ))}
          <p className="px-3 pb-1 pt-2 text-xs leading-5 text-[#6d6e7a]">
            En Android usa Google Calendar; en iPhone, el archivo se abre directamente en Calendario.
            {plan.reminder_minutes_before ? " El archivo incluye la alarma del recordatorio." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
