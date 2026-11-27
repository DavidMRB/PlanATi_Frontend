"use client";

import { ArrowRight, History, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listModerationActions, MODERATION_ACTION_LABEL, TARGET_TYPE_LABEL, type ModerationActionItem } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/datetime";

const PAGE_SIZE = 25;

const select =
  "h-10 w-full min-w-0 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

function actionTone(action: string): string {
  if (/^(SUSPEND|DELETE|BLOCK|HIDE|DISMISS)_/.test(action)) return "bg-[#fde0e3] text-[#a30f35]";
  if (/^(REACTIVATE|RESTORE|RESOLVE|UNBLOCK)_/.test(action)) return "bg-[#e3f7f3] text-[#0b6b5c]";
  return "bg-[#eef0ff] text-[#514ddd]";
}

// Destinos con página propia en la consola.
function targetHref(action: ModerationActionItem): string | null {
  if (action.target_type === "ESTABLISHMENT") return `/admin/establishments/${action.target_id}`;
  if (action.target_type === "USER") return `/admin/users/${action.target_id}`;
  return null;
}

export default function AdminActivityPage() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Auditoría del sistema</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Actividad</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">Bitácora de moderación: quién hizo qué, sobre qué contenido y por qué.</p>
      </header>

      <div className="grid grid-cols-2 items-end gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,13rem)_1fr]">
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#43506a]" htmlFor="activity-action">
          Tipo de acción
          <select id="activity-action" value={action} onChange={(event) => setAction(event.target.value)} className={select}>
            <option value="">Todas las acciones</option>
            {Object.entries(MODERATION_ACTION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#43506a]" htmlFor="activity-target">
          Tipo de destino
          <select id="activity-target" value={targetType} onChange={(event) => setTargetType(event.target.value)} className={select}>
            <option value="">Todos los destinos</option>
            {Object.entries(TARGET_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => { setAction(""); setTargetType(""); }} disabled={!action && !targetType} className="col-span-2 ml-auto flex h-9 items-center gap-2 rounded-xl bg-[#f3f5ff] px-3 text-xs font-bold text-[#514ddd] disabled:opacity-50 lg:col-span-1 lg:h-10">
          <RotateCcw aria-hidden="true" className="size-4" /> Limpiar filtros
        </button>
      </div>

      <ActivityPages key={`${action}-${targetType}`} action={action} targetType={targetType} />
    </div>
  );
}

function ActivityPages({ action, targetType }: { action: string; targetType: string }) {
  const [items, setItems] = useState<ModerationActionItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listModerationActions({ action: action || undefined, target_type: targetType || undefined, skip, limit: PAGE_SIZE });
        const pageItems = page?.items ?? [];
        setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la bitácora.");
        setItems((current) => current ?? []);
      }
    },
    [action, targetType],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  if (items === null) return <div className="h-64 animate-pulse rounded-2xl bg-[#e9edff]" aria-busy="true" />;

  const loadMore = async () => {
    setLoadingMore(true);
    await load(items.length);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {total > 0 && <p className="text-sm font-bold text-[#514ddd]">{total} {total === 1 ? "acción registrada" : "acciones registradas"}</p>}
      {items.length === 0 && !error ? (
        <EmptyState icon={History} title="Sin actividad con esos filtros" />
      ) : (
        <div className="lg:overflow-hidden lg:rounded-2xl lg:bg-white lg:shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          <div aria-hidden="true" className="hidden grid-cols-[2fr_1.25fr_1fr_1.2fr] gap-4 bg-[#eef2ff] px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#43506a] lg:grid">
            <span>Acción</span><span>Destino</span><span>Fecha y hora</span><span>Responsable</span>
          </div>
          <ol className="space-y-3 lg:divide-y lg:divide-[#f0f2f8] lg:space-y-0">
            {items.map((item) => {
              const href = targetHref(item);
              const target = `${TARGET_TYPE_LABEL[item.target_type] ?? item.target_type} #${item.target_id}`;
              return (
                <li key={item.id} className="grid gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm lg:grid-cols-[2fr_1.25fr_1fr_1.2fr] lg:gap-4 lg:rounded-none lg:px-5 lg:shadow-none">
                  <div className="min-w-0 space-y-1.5">
                    <p className={`inline-flex max-w-full break-words rounded-full px-2.5 py-1 text-xs font-bold ${actionTone(item.action)}`}>{MODERATION_ACTION_LABEL[item.action] ?? item.action}</p>
                    {item.reason && <p className="break-words text-[#43506a]">“{item.reason}”</p>}
                    {item.details && Object.keys(item.details).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold text-[#514ddd]">Detalles</summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f8f9ff] p-3 text-[#26344d]">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="break-words font-semibold">{target}</p>
                    {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-[#514ddd] hover:underline">Ver detalle <ArrowRight aria-hidden="true" className="size-3" /></Link>}
                  </div>
                  <time dateTime={item.created_at} className="text-xs text-[#6d6e7a]">{formatDateTime(item.created_at)}</time>
                  <div className="flex min-w-0 items-center gap-2 border-t border-[#edf0fa] pt-2 lg:border-0 lg:pt-0">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef0ff] text-xs font-bold text-[#514ddd]">{(item.admin_name ?? "Sistema").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</span>
                    <div className="min-w-0">
                      <p className="break-words text-xs font-bold">{item.admin_name ?? "Sistema"}</p>
                      {item.admin_email && <p className="break-all text-xs text-[#6d6e7a]">{item.admin_email}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
