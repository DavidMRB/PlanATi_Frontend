"use client";

import { ShieldOff } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";

// Destino de una sesión cuya cuenta fue suspendida (403 ACCOUNT_SUSPENDED). El motivo llega en el error del
// backend y lo guarda AuthProvider; si se entra directamente, no hay motivo que mostrar.
export default function AccountSuspendedPage() {
  const { suspended } = useAuth();

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f8f9ff] px-4 py-12 text-[#17243d]">
      <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-6 text-center shadow-[0_8px_24px_rgba(23,36,61,0.08)] sm:p-10">
        <div className="flex justify-center">
          <BrandMark compact />
        </div>
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <ShieldOff aria-hidden="true" className="size-7" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Tu cuenta está suspendida</h1>
          <p className="text-sm leading-relaxed text-[#43506a]">
            Un administrador suspendió tu cuenta. Mientras siga así no podrás publicar reseñas, planear visitas ni usar tu
            panel.
          </p>
        </div>

        {suspended?.reason ? (
          <div className="rounded-2xl bg-[#f1f2f6] px-5 py-4 text-left text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6d6e7a]">Motivo</p>
            <p className="mt-1 whitespace-pre-line text-[#17243d]">{suspended.reason}</p>
          </div>
        ) : null}

        <p className="text-sm text-[#43506a]">
          Revisa las{" "}
          <Link href="/legal/community-guidelines" className="font-semibold text-[#514ddd] hover:underline">
            normas de la comunidad
          </Link>
          . Si crees que es un error, escríbenos a soporte desde el correo de tu cuenta.
        </p>

        <div className="flex justify-center">
          <LogoutButton className="justify-center bg-[#eef0ff] px-5 py-2.5 text-[#514ddd] hover:bg-[#e2e5ff] hover:text-[#514ddd]" />
        </div>
      </div>
    </main>
  );
}
