"use client";

import { Flag, MapPin, MapPinOff, Search, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import ExcelExportButton from "@/components/ui/ExcelExportButton";
import { listAdminEstablishments, type AdminEstablishmentListItem } from "@/lib/admin-api";
import { formatRating } from "@/lib/establishments-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import type { EstablishmentStatus } from "@/lib/restaurant-api";

type StatusFilter = EstablishmentStatus | "ALL";

const PAGE_SIZE = 20;

const TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "SUSPENDED", label: "Suspendidos" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "ALL", label: "Todos" },
];

function parseStatus(value: string | null): StatusFilter {
  return TABS.some((tab) => tab.value === value) ? (value as StatusFilter) : "ALL";
}

export default function EstablishmentsDirectory({ pendingOnly = false }: { pendingOnly?: boolean }) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <EstablishmentsView pendingOnly={pendingOnly} />
    </Suspense>
  );
}

function EstablishmentsView({ pendingOnly }: { pendingOnly: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = pendingOnly ? "PENDING" : parseStatus(params.get("status"));
  const search = params.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const exportParams = new URLSearchParams({ status });
  if (search) exportParams.set("search", search);

  // Sincroniza el campo con la URL (atrás/adelante del navegador).
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setSearchInput(search);
  }

  const navigate = (next: { status?: StatusFilter; search?: string }) => {
    const query = new URLSearchParams();
    if (!pendingOnly) query.set("status", next.status ?? status);
    const text = next.search ?? search;
    if (text) query.set("search", text);
    router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ search: searchInput.trim() });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{pendingOnly ? "Solicitudes" : "Establecimientos"}</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">
          {pendingOnly ? "Revisa las solicitudes pendientes de aprobación y abre su ficha para tomar una decisión." : "Consulta el directorio y gestiona la información y el estado de los locales."}
        </p>
        <ExcelExportButton filename="establecimientos-planati.xlsx" path={`/admin/exports/establishments.xlsx?${exportParams}`} label="Exportar listado en Excel" />
      </header>

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5">
        <form onSubmit={handleSearch} role="search" className="flex h-12 items-center gap-3 rounded-xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
          <Search aria-hidden="true" className="size-5 text-[#81869a]" />
          <label htmlFor="admin-establishment-search" className="sr-only">
            Buscar establecimientos
          </label>
          <input
            id="admin-establishment-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o correo"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
          />
        </form>

        {!pendingOnly && <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => navigate({ status: tab.value })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === tab.value ? "bg-[#0b6b5c] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>}
      </div>

      <EstablishmentPages key={`${status}-${search}`} status={status} search={search} pendingOnly={pendingOnly} />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-24 animate-pulse rounded-2xl bg-[#e9edff]" />
      ))}
    </div>
  );
}

function EstablishmentPages({ status, search, pendingOnly }: { status: StatusFilter; search: string; pendingOnly: boolean }) {
  const [items, setItems] = useState<AdminEstablishmentListItem[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page =
          (await listAdminEstablishments({
            status: status === "ALL" ? undefined : status,
            search: search || undefined,
            skip,
            limit: PAGE_SIZE,
          })) ?? [];
        setItems((current) => (skip === 0 || !current ? page : [...current, ...page.filter((item) => !current.some((known) => known.id === item.id))]));
        // El listado no trae total: si la página llegó completa puede haber más.
        setHasMore(page.length === PAGE_SIZE);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los establecimientos.");
        setItems((current) => current ?? []);
      }
    },
    [status, search],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  if (items === null) return <ListSkeleton />;

  const statusBadge = (item: AdminEstablishmentListItem) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[item.status]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {ESTABLISHMENT_STATUS_LABEL[item.status] ?? item.status}
    </span>
  );

  const rating = (item: AdminEstablishmentListItem) =>
    item.rating_count > 0 ? (
      <span className="flex items-center gap-1 font-semibold">
        <Star aria-hidden="true" className="size-3.5 fill-[#d6154a] text-[#d6154a]" />
        {formatRating(item.rating_avg)}
        <span className="font-normal text-[#6d6e7a]">({item.rating_count})</span>
      </span>
    ) : (
      <span className="text-[#9295a4]">Sin reseñas</span>
    );

  const location = (item: AdminEstablishmentListItem) =>
    item.has_location ? (
      <span className="flex items-center gap-1 text-[#0b6b5c]">
        <MapPin aria-hidden="true" className="size-3.5" />
        Ubicado
      </span>
    ) : (
      <span className="flex items-center gap-1 text-amber-700">
        <MapPinOff aria-hidden="true" className="size-3.5" />
        Sin ubicación
      </span>
    );

  const reports = (item: AdminEstablishmentListItem) =>
    item.open_reports_count > 0 ? (
      <span className="flex items-center gap-1 rounded-full bg-[#fde0e3] px-2 py-0.5 text-xs font-bold text-[#a30f35]">
        <Flag aria-hidden="true" className="size-3" />
        {item.open_reports_count}
      </span>
    ) : (
      <span className="text-[#9295a4]">—</span>
    );

  const loadMore = async () => {
    setLoadingMore(true);
    await load(items.length);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {items.length === 0 && !error && (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#6d6e7a] shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          {pendingOnly ? "No hay solicitudes pendientes para esta búsqueda." : "No hay establecimientos para este filtro."}
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f5ff] text-xs uppercase tracking-wide text-[#6d6e7a]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Establecimiento</th>
                  <th className="px-5 py-4 font-semibold">Cuenta</th>
                  <th className="px-5 py-4 font-semibold">Puntuación</th>
                  <th className="px-5 py-4 font-semibold">Ubicación</th>
                  <th className="px-5 py-4 font-semibold">Reportes</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f8]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9ff]">
                    <td className="px-5 py-4">
                      <p className="font-bold">{item.name}</p>
                      <span className="mt-1 inline-block rounded-md bg-[#eef0ff] px-2 py-0.5 text-xs font-semibold text-[#514ddd]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{item.owner_email}</p>
                      <p className="text-xs text-[#6d6e7a]">{item.manager_name ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4">{rating(item)}</td>
                    <td className="px-5 py-4 text-xs font-semibold">{location(item)}</td>
                    <td className="px-5 py-4">{reports(item)}</td>
                    <td className="px-5 py-4">{statusBadge(item)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/establishments/${item.id}${pendingOnly ? "?from=requests" : ""}`}
                        className="inline-flex rounded-lg bg-[#eef0ff] px-4 py-2 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                      >
                        {item.status === "PENDING" ? "Revisar" : "Ver"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {items.map((item) => (
              <li key={item.id} className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{item.name}</p>
                    <p className="truncate text-xs text-[#6d6e7a]">{item.owner_email}</p>
                  </div>
                  {statusBadge(item)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {rating(item)}
                  <span className="font-semibold">{location(item)}</span>
                  {item.open_reports_count > 0 && reports(item)}
                </div>
                <Link
                  href={`/admin/establishments/${item.id}${pendingOnly ? "?from=requests" : ""}`}
                  className="flex justify-center rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4542ca]"
                >
                  {item.status === "PENDING" ? "Revisar" : "Ver"}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <LoadMoreButton loaded={items.length} hasMore={hasMore} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
