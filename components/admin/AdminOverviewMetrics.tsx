"use client";

import { useEffect, useState } from "react";
import { getAdminDashboard, type AdminDashboard } from "@/lib/admin-api";

type Metric = {
  key: keyof AdminDashboard;
  label: string;
  tone: string;
};

export default function AdminOverviewMetrics({ metrics }: { metrics: readonly Metric[] }) {
  const [dashboard, setDashboard] = useState<AdminDashboard>();

  useEffect(() => {
    const controller = new AbortController();
    getAdminDashboard()
      .then((data) => {
        if (!controller.signal.aborted) setDashboard(data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!dashboard) return null;

  return (
    <dl className="hidden grid-flow-col auto-cols-fr gap-3 sm:grid">
      {metrics.map(({ key, label, tone }) => (
        <div key={key} className={`rounded-2xl p-4 ${tone}`}>
          <dt className="text-xs font-semibold">{label}</dt>
          <dd className="text-2xl font-extrabold tracking-tight">{dashboard[key].toLocaleString("es-CO")}</dd>
        </div>
      ))}
    </dl>
  );
}
