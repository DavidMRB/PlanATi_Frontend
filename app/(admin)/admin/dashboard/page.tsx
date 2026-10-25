"use client";

import { ArrowRight, ClipboardList, MessageSquare, Store, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { getAdminDashboard, listAdminEstablishments, type AdminDashboard } from "@/lib/admin-api";

type Stats = AdminDashboard & { pending_count: number | null };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, pending] = await Promise.all([
          getAdminDashboard(),
          listAdminEstablishments({ status: "PENDING" }),
        ]);
        if (dashboard) {
          setStats({ ...dashboard, pending_count: pending?.length ?? null });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el resumen.");
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Resumen</h1>
          <p className="max-w-xl text-base text-[#6d6e7a]">Estado general de la plataforma.</p>
        </div>

        <Link
          href="/admin/establishments?status=PENDING"
          className="inline-flex items-center justify-between gap-3 rounded-xl bg-[#514ddd] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
        >
          Revisar solicitudes pendientes
          {stats?.pending_count ? (
            <span className="rounded-full bg-[#d6154a] px-2 py-0.5 text-xs">{stats.pending_count}</span>
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
        </Link>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-[#fde8ea] p-5 text-[#a30f35]">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!stats && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-2xl bg-[#e9edff]" />
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Users} label="Usuarios" value={stats.users_count} iconTone="bg-[#eef0ff] text-[#514ddd]" />
          <StatCard icon={Store} label="Establecimientos" value={stats.establishments_count} iconTone="bg-[#c6f7f0] text-[#0b6b5c]" />
          <StatCard
            icon={ClipboardList}
            label="Solicitudes pendientes"
            value={stats.pending_count ?? "—"}
            iconTone="bg-[#fde0e3] text-[#d6154a]"
            highlight
          />
          <StatCard icon={MessageSquare} label="Reseñas" value={stats.reviews_count} iconTone="bg-[#eef0ff] text-[#514ddd]" />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconTone,
  highlight = false,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
  iconTone: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)] ${
        highlight ? "border-r-4 border-[#d6154a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-[#17243d]">{label}</span>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
          <Icon aria-hidden={true} className="size-5" />
        </span>
      </div>
      <p className={`mt-6 text-4xl font-extrabold ${highlight ? "text-[#d6154a]" : ""}`}>{value}</p>
    </div>
  );
}
