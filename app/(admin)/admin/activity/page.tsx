"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listModerationActions, MODERATION_ACTION_LABEL, TARGET_TYPE_LABEL, type ModerationActionItem } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/datetime";

const PAGE_SIZE = 25;

const select =
  "h-10 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

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
        <h1 className="text-3xl font-extrabold sm:text-4xl">Actividad</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">Bitácora de moderación: quién hizo qué, sobre qué contenido y por qué.</p>
      </header>

      <div className="flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5">
        <label className="sr-only" htmlFor="activity-action">
          Acción
        </label>
        <select id="activity-action" value={action} onChange={(event) => setAction(event.target.value)} className={select}>
          <option value="">Todas las acciones</option>
          {Object.entries(MODERATION_ACTION_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="activity-target">
          Tipo de destino
        </label>
        <select id="activity-target" value={targetType} onChange={(event) => setTargetType(event.target.value)} className={select}>
          <option value="">Todos los destinos</option>
          {Object.entries(TARGET_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
      {items.length === 0 && !error ? (
        <EmptyState icon={History} title="Sin actividad con esos filtros" />
      ) : (
        <ol className="divide-y divide-[#f0f2f8] overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          {items.map((item) => {
            const href = targetHref(item);
            const target = `${TARGET_TYPE_LABEL[item.target_type] ?? item.target_type} #${item.target_id}`;
            return (
              <li key={item.id} className="space-y-1 px-5 py-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p>
                    <span className="font-bold">{item.admin_name ?? "Sistema"}</span>{" "}
                    <span className="text-[#43506a]">{(MODERATION_ACTION_LABEL[item.action] ?? item.action).toLowerCase()}</span>{" "}
                    {href ? (
                      <Link href={href} className="font-semibold text-[#514ddd] hover:underline">
                        {target}
                      </Link>
                    ) : (
                      <span className="font-semibold">{target}</span>
                    )}
                  </p>
                  <time dateTime={item.created_at} className="text-xs text-[#6d6e7a]">
                    {formatDateTime(item.created_at)}
                  </time>
                </div>
                {item.admin_email && <p className="text-xs text-[#6d6e7a]">{item.admin_email}</p>}
                {item.reason && <p className="text-[#43506a]">“{item.reason}”</p>}
                {item.details && Object.keys(item.details).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-[#514ddd]">Detalles</summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f8f9ff] p-3 text-[#26344d]">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
