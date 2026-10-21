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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Establecimientos</h1>
          <p className="text-sm text-[#6d6e7a]">Revisa y gestiona las solicitudes de restaurantes.</p>
        </div>
        <form onSubmit={handleSearch} className="flex h-10 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#e4e6f0]">
          <Search aria-hidden="true" className="size-4 text-[#81869a]" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o correo"
            className="w-56 bg-transparent text-sm outline-none"
          />
        </form>
      </header>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => selectStatus(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              status === tab.value ? "bg-[#4c4cdd] text-white" : "bg-white text-[#6d6e7a] ring-1 ring-[#e4e6f0] hover:text-[#4c4cdd]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {!items && !error && <p className="text-sm text-[#6d6e7a]">Cargando solicitudes...</p>}
      {items && items.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#6d6e7a] ring-1 ring-[#e4e6f0]">
          No hay establecimientos para este filtro.
        </p>
      )}

      {items && items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#e4e6f0]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#e4e6f0] text-xs uppercase tracking-wide text-[#9295a4]">
              <tr>
                <th className="px-4 py-3 font-semibold">Establecimiento</th>
                <th className="px-4 py-3 font-semibold">Gerente</th>
                <th className="px-4 py-3 font-semibold">Correo de cuenta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f8]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#f8f9ff]">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-[#6d6e7a]">{item.category}</p>
                  </td>
                  <td className="px-4 py-3">{item.manager_name ?? "—"}</td>
                  <td className="px-4 py-3">{item.owner_email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[item.status]}`}>
                      {ESTABLISHMENT_STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/establishments/${item.id}`} className="font-semibold text-[#4c4cdd] hover:underline">
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
