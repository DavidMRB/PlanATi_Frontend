"use client";

import { Flag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ModerationHelp from "@/components/admin/ModerationHelp";
import ReportCard from "@/components/admin/ReportCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import {
  announceAdminCountsChanged,
  listReports,
  TARGET_TYPE_LABEL,
  type AdminReport,
  type ReportReason,
  type ReportStatusFilter,
  type ReportTargetType,
} from "@/lib/admin-api";
import { REPORT_REASON_LABEL } from "@/lib/reports-api";

const PAGE_SIZE = 20;

const STATUSES: Array<{ value: ReportStatusFilter; label: string }> = [
  { value: "OPEN", label: "Abiertos" },
  { value: "RESOLVED", label: "Resueltos" },
  { value: "DISMISSED", label: "Descartados" },
  { value: "ALL", label: "Todos" },
];

const TARGETS: ReportTargetType[] = ["REVIEW", "REVIEW_REPLY", "REVIEW_IMAGE", "ESTABLISHMENT", "ESTABLISHMENT_IMAGE", "MENU_ITEM", "USER"];

const select =
  "h-10 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatusFilter>("OPEN");
  const [targetType, setTargetType] = useState<ReportTargetType | "">("");
  const [reason, setReason] = useState<ReportReason | "">("");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Reportes</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">
          Contenido que la comunidad marcó como inapropiado. Resolver o descartar cierra todos los reportes abiertos del mismo
          contenido y avisa a quienes reportaron.
        </p>
      </header>

      <ModerationHelp />

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Estado" className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => setStatus(item.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === item.value ? "bg-[#514ddd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="report-target">
            Tipo de contenido
          </label>
          <select id="report-target" value={targetType} onChange={(event) => setTargetType(event.target.value as ReportTargetType | "")} className={select}>
            <option value="">Todo el contenido</option>
            {TARGETS.map((value) => (
              <option key={value} value={value}>
                {TARGET_TYPE_LABEL[value]}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="report-reason">
            Motivo
          </label>
          <select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value as ReportReason | "")} className={select}>
            <option value="">Todos los motivos</option>
            {(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map((value) => (
              <option key={value} value={value}>
                {REPORT_REASON_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ReportPages key={`${status}-${targetType}-${reason}`} status={status} targetType={targetType} reason={reason} />
    </div>
  );
}

function ReportPages({ status, targetType, reason }: { status: ReportStatusFilter; targetType: ReportTargetType | ""; reason: ReportReason | "" }) {
  const [items, setItems] = useState<AdminReport[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listReports({ status, target_type: targetType || undefined, reason: reason || undefined, skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los reportes.");
        setItems((current) => current ?? []);
      }
    },
    [status, targetType, reason],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  if (items === null) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map((key) => (
          <div key={key} className="h-40 animate-pulse rounded-2xl bg-[#e9edff]" />
        ))}
      </div>
    );
  }

  // Cerrar un reporte cierra todos los abiertos del mismo destino: se actualizan también los hermanos en pantalla.
  const onChange = (updated: AdminReport, text: string) => {
    setMessage(text);
    setItems(
      (current) =>
        current?.map((item) =>
          item.id === updated.id
            ? updated
            : item.status === "OPEN" && item.target_type === updated.target_type && item.target_id === updated.target_id
              ? { ...item, status: updated.status, resolution_note: updated.resolution_note, resolved_at: updated.resolved_at, reports_on_target: 0 }
              : item,
        ) ?? current,
    );
    announceAdminCountsChanged();
  };

  // En "Abiertos", los que ya se cerraron siguen en pantalla hasta recargar; se descuentan al pedir más.
  const closedHere = status === "OPEN" ? items.filter((item) => item.status !== "OPEN").length : 0;

  const loadMore = async () => {
    setLoadingMore(true);
    await load(items.length - closedHere);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className="rounded-2xl bg-[#c6f7f0] px-5 py-3 text-sm font-semibold text-[#0b6b5c]">
          {message}
        </p>
      )}
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {items.length === 0 && !error ? (
        <EmptyState icon={Flag} title={status === "OPEN" ? "No hay reportes abiertos" : "No hay reportes con esos filtros"} description={status === "OPEN" ? "¡Todo al día!" : undefined} />
      ) : (
        <ul className="space-y-4">
          {items.map((report) => (
            <ReportCard key={report.id} report={report} onChange={onChange} />
          ))}
        </ul>
      )}
      <LoadMoreButton
        loaded={items.length - closedHere}
        total={status === "OPEN" ? total - closedHere : total}
        isLoading={loadingMore}
        onLoadMore={() => void loadMore()}
      />
    </div>
  );
}
