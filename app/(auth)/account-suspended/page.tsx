"use client";

import { ArrowRight, CalendarDays, CircleAlert, Headphones, MessageSquareOff, ShieldOff } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";

// Destino de una sesión cuya cuenta fue suspendida (403 ACCOUNT_SUSPENDED). El motivo llega en el error del
// backend y lo guarda AuthProvider; si se entra directamente, no hay motivo que mostrar.
export default function AccountSuspendedPage() {
  const { suspended } = useAuth();

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[#f6f7fc] px-4 py-6 text-[#17243d] sm:py-14">
      <div className="relative w-full max-w-3xl space-y-5 overflow-hidden rounded-3xl bg-white p-5 text-center shadow-[0_12px_40px_rgba(50,43,120,0.12)] sm:p-9">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#be123c] via-[#d6154a] to-[#514ddd]" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BrandMark />
          <span className="rounded-full bg-[#fde0e3] px-3 py-1 text-xs font-bold text-[#a30f35]">Acceso restringido</span>
        </div>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#d6154a] text-white shadow-[0_0_30px_#fda4af]">
          <ShieldOff aria-hidden="true" className="size-8" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Tu cuenta está suspendida</h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#43506a]">
            Un administrador suspendió tu cuenta. Mientras siga así no podrás publicar reseñas, planear visitas ni usar tu
            panel.
          </p>
        </div>

        {suspended?.reason ? (
          <div className="flex gap-3 rounded-2xl bg-[#eef0ff] px-4 py-4 text-left text-sm">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#a30f35]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#a30f35]">Motivo de la suspensión</p>
              <p className="mt-1 whitespace-pre-line text-[#17243d]">{suspended.reason}</p>
            </div>
          </div>
        ) : null}

        <section className="space-y-3 text-left">
          <h2 className="text-base font-extrabold">Acciones temporalmente limitadas</h2>
          <ul className="grid gap-2 text-sm font-semibold text-[#43506a] sm:grid-cols-3">
            <li className="flex items-center gap-2 rounded-xl bg-[#f3f5ff] p-3"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-[#a30f35]" /> Planear visitas</li>
            <li className="flex items-center gap-2 rounded-xl bg-[#f3f5ff] p-3"><MessageSquareOff aria-hidden="true" className="size-4 shrink-0 text-[#a30f35]" /> Publicar reseñas</li>
            <li className="flex items-center gap-2 rounded-xl bg-[#f3f5ff] p-3"><ShieldOff aria-hidden="true" className="size-4 shrink-0 text-[#a30f35]" /> Usar tu panel</li>
          </ul>
        </section>

        <section className="space-y-2 rounded-2xl bg-[#e7efff] p-4 text-left">
          <h2 className="flex items-center gap-2 text-base font-extrabold"><Headphones aria-hidden="true" className="size-5 text-[#514ddd]" /> ¿Crees que es un error?</h2>
          <p className="text-sm leading-relaxed text-[#43506a]">Escríbenos a soporte desde el correo de tu cuenta para que revisemos el caso.</p>
          <Link href="/legal/community-guidelines" className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#514ddd] hover:bg-[#f3f5ff]">
            Ver normas de la comunidad <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <div className="flex justify-center">
          <LogoutButton className="justify-center bg-[#eef0ff] px-5 py-2.5 text-[#514ddd] hover:bg-[#e2e5ff] hover:text-[#514ddd]" />
        </div>
      </div>
    </main>
  );
}
