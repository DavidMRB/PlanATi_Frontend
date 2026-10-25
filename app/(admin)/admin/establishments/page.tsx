"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { listAdminEstablishments, type AdminEstablishmentListItem } from "@/lib/admin-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import type { EstablishmentStatus } from "@/lib/restaurant-api";

type StatusFilter = EstablishmentStatus | "ALL";

const TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "ALL", label: "Todos" },
];

// El layout admin no monta sus hijos hasta validar el rol, así que aquí es seguro
// leer el filtro inicial de la URL sin useSearchParams (y sin Suspense).
function readInitialStatus(): StatusFilter {
  const value = new URLSearchParams(window.location.search).get("status");
  return TABS.some((tab) => tab.value === value) ? (value as StatusFilter) : "PENDING";
}

export default function AdminEstablishmentsPage() {
  const [status, setStatus] = useState<StatusFilter>(readInitialStatus);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AdminEstablishmentListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    listAdminEstablishments({
      status: status === "ALL" ? undefined : status,
      search: search || undefined,
    })
      .then((data) => {
        if (!cancelled) setItems(data ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las solicitudes.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status, search]);

  const resetResults = () => {
    setItems(null);
    setError("");
  };

  const selectStatus = (value: StatusFilter) => {
    resetResults();
    setStatus(value);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetResults();
    setSearch(searchInput.trim());
  };

  const statusBadge = (item: AdminEstablishmentListItem) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[item.status]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {ESTABLISHMENT_STATUS_LABEL[item.status]}
    </span>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Establecimientos</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">Revisa y gestiona las solicitudes de restaurantes.</p>
      </header>

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5">
        <form onSubmit={handleSearch} className="flex h-12 items-center gap-3 rounded-xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
          <Search aria-hidden="true" className="size-5 text-[#81869a]" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o correo"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
          />
        </form>

        <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => selectStatus(tab.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === tab.value ? "bg-[#0b6b5c] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {!items && !error && (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 animate-pulse rounded-2xl bg-[#e9edff]" />
          ))}
        </div>
      )}
      {items && items.length === 0 && (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-[#6d6e7a] shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          No hay establecimientos para este filtro.
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f5ff] text-xs uppercase tracking-wide text-[#6d6e7a]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Establecimiento</th>
                  <th className="px-6 py-4 font-semibold">Gerente</th>
                  <th className="px-6 py-4 font-semibold">Correo de cuenta</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f8]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9ff]">
                    <td className="px-6 py-5">
                      <p className="text-base font-bold">{item.name}</p>
                      <span className="mt-1 inline-block rounded-md bg-[#eef0ff] px-2 py-0.5 text-xs font-semibold text-[#514ddd]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">{item.manager_name ?? "—"}</td>
                    <td className="px-6 py-5 font-medium">{item.owner_email}</td>
                    <td className="px-6 py-5">{statusBadge(item)}</td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/establishments/${item.id}`}
                        className="inline-flex rounded-lg bg-[#eef0ff] px-4 py-2 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-4 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="space-y-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{item.name}</p>
                    <p className="text-xs font-semibold text-[#0b6b5c]">{item.category}</p>
                  </div>
                  {statusBadge(item)}
                </div>
                <dl className="space-y-1 rounded-xl bg-[#f3f5ff] p-4 text-sm">
                  <div className="flex gap-1.5">
                    <dt className="font-bold">Gerente:</dt>
                    <dd className="min-w-0 truncate">{item.manager_name ?? "—"}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="font-bold">Correo:</dt>
                    <dd className="min-w-0 truncate">{item.owner_email}</dd>
                  </div>
                </dl>
                <Link
                  href={`/admin/establishments/${item.id}`}
                  className="flex justify-center rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4542ca]"
                >
                  Revisar
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
