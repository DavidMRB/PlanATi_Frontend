"use client";

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  EyeOff,
  Flag,
  MapPinOff,
  MessageSquare,
  ShieldAlert,
  Store,
  TriangleAlert,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { getAdminDashboard, type AdminDashboard } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then((data) => setStats(data ?? null))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el resumen."));
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Resumen</h1>
          <p className="max-w-xl text-base text-[#6d6e7a]">Estado general de la plataforma y lo que requiere tu atención.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-between gap-3 rounded-xl bg-[#d6154a] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(214,21,74,0.24)] hover:bg-[#b8113f]"
          >
            Revisar reportes
            {stats?.open_reports ? (
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{stats.open_reports}</span>
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
          </Link>
          <Link
            href="/admin/establishments?status=PENDING"
            className="inline-flex items-center justify-between gap-3 rounded-xl bg-[#514ddd] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
          >
            Revisar solicitudes
            {stats?.pending_establishments ? (
              <span className="rounded-full bg-[#d6154a] px-2 py-0.5 text-xs">{stats.pending_establishments}</span>
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
          </Link>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-[#fde8ea] p-5 text-[#a30f35]">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!stats && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-2xl bg-[#e9edff]" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#d6154a]">Requiere atención</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard
                icon={Flag}
                label="Reportes abiertos"
                value={stats.open_reports}
                iconTone="bg-[#fde0e3] text-[#d6154a]"
                href="/admin/reports"
                highlight={stats.open_reports > 0}
              />
              <StatCard
                icon={ClipboardList}
                label="Solicitudes pendientes"
                value={stats.pending_establishments}
                iconTone="bg-[#fde0e3] text-[#d6154a]"
                href="/admin/establishments?status=PENDING"
                highlight={stats.pending_establishments > 0}
              />
              <StatCard
                icon={ShieldAlert}
                label="Pendientes de revisión"
                hint="Comentarios reescritos tras un bloqueo"
                value={stats.flagged_for_review}
                iconTone="bg-amber-100 text-amber-800"
                href="/admin/reviews?queue=flagged"
                highlight={stats.flagged_for_review > 0}
              />
              <StatCard
                icon={MapPinOff}
                label="Locales sin ubicación"
                hint="No aparecen en el mapa"
                value={stats.establishments_without_location}
                iconTone="bg-amber-100 text-amber-800"
                href="/admin/establishments?status=APPROVED"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#514ddd]">Plataforma</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard icon={Users} label="Usuarios" value={stats.users_count} iconTone="bg-[#eef0ff] text-[#514ddd]" href="/admin/users" />
              <StatCard
                icon={Store}
                label="Establecimientos"
                value={stats.establishments_count}
                iconTone="bg-[#c6f7f0] text-[#0b6b5c]"
                href="/admin/establishments?status=ALL"
              />
              <StatCard
                icon={MessageSquare}
                label="Reseñas"
                hint={`${stats.reviews_last_7_days} en los últimos 7 días`}
                value={stats.reviews_count}
                iconTone="bg-[#eef0ff] text-[#514ddd]"
                href="/admin/reviews"
              />
              <StatCard icon={CalendarDays} label="Planes programados" value={stats.scheduled_plans} iconTone="bg-[#c6f7f0] text-[#0b6b5c]" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#6d6e7a]">Moderación</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard
                icon={ShieldAlert}
                label="Comentarios bloqueados"
                hint="Reseñas y respuestas"
                value={stats.blocked_comments}
                iconTone="bg-red-100 text-red-700"
                href="/admin/reviews?queue=blocked"
              />
              <StatCard
                icon={EyeOff}
                label="Reseñas ocultas"
                value={stats.hidden_reviews}
                iconTone="bg-slate-200 text-slate-700"
                href="/admin/reviews?queue=hidden"
              />
              <StatCard icon={UserX} label="Usuarios suspendidos" value={stats.suspended_users} iconTone="bg-slate-200 text-slate-700" href="/admin/users" />
              <StatCard
                icon={Store}
                label="Locales suspendidos"
                value={stats.suspended_establishments}
                iconTone="bg-slate-200 text-slate-700"
                href="/admin/establishments?status=SUSPENDED"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconTone,
  hint,
  href,
  highlight = false,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
  iconTone: string;
  hint?: string;
  href?: string;
  highlight?: boolean;
}) {
  const className = `block rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] ${
    highlight ? "border-r-4 border-[#d6154a]" : ""
  } ${href ? "transition hover:ring-2 hover:ring-[#c9cdf4]" : ""}`;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-[#17243d]">{label}</span>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
          <Icon aria-hidden={true} className="size-5" />
        </span>
      </div>
      <p className={`mt-6 text-4xl font-extrabold ${highlight ? "text-[#d6154a]" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[#6d6e7a]">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
