"use client";

import { ClipboardList, MessageSquare, Store, Users } from "lucide-react";
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
      <header>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-sm text-[#6d6e7a]">Estado general de la plataforma.</p>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!stats && !error && <p className="text-sm text-[#6d6e7a]">Cargando métricas...</p>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Usuarios" value={stats.users_count} />
          <StatCard icon={Store} label="Establecimientos" value={stats.establishments_count} />
          <StatCard icon={ClipboardList} label="Solicitudes pendientes" value={stats.pending_count ?? "—"} highlight />
          <StatCard icon={MessageSquare} label="Reseñas" value={stats.reviews_count} />
        </div>
      )}

      <Link
        href="/admin/establishments?status=PENDING"
        className="inline-flex rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
      >
        Revisar solicitudes pendientes
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e4e6f0]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#6d6e7a]">{label}</span>
        <Icon aria-hidden={true} className={`size-5 ${highlight ? "text-amber-500" : "text-[#4c4cdd]"}`} />
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}
