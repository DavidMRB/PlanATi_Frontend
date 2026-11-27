"use client";

import { ArrowRight, Lock, UserRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import Avatar from "@/components/ui/Avatar";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Configuración</h1>
        <p className="text-sm text-[#43506a]">Gestiona el perfil y la privacidad de tu cuenta de administración.</p>
      </header>
      <section aria-labelledby="admin-account-title" className="space-y-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 id="admin-account-title" className="text-lg font-bold">Cuenta administrativa</h2>
        <div className="flex items-center gap-3 rounded-xl bg-[#eef0ff] p-4">
          <Avatar user={user} className="size-12 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold">{user.full_name}</p>
            <p className="text-sm text-[#43506a]">{user.email}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/profile" className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dce1f2] px-3 py-2 text-sm font-semibold text-[#514ddd] hover:bg-[#eef0ff]">
            <UserRound aria-hidden="true" className="size-4 shrink-0" /> Editar perfil y teléfono
            <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" />
          </Link>
          <Link href="/profile#privacidad" className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dce1f2] px-3 py-2 text-sm font-semibold text-[#514ddd] hover:bg-[#eef0ff]">
            <Lock aria-hidden="true" className="size-4 shrink-0" /> Gestionar datos y consentimientos
            <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" />
          </Link>
        </div>
      </section>
    </main>
  );
}
