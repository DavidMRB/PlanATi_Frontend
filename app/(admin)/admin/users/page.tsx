"use client";

import { Flag, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { listAdminUsers, type AdminUserListItem, type UserRole, type UserStatus } from "@/lib/admin-api";
import { formatDate } from "@/lib/datetime";
import { ROLE_LABEL, USER_STATUS_CLASS, USER_STATUS_LABEL } from "@/lib/format";

const PAGE_SIZE = 20;

const ROLES: Array<{ value: UserRole | ""; label: string }> = [
  { value: "", label: "Todos los roles" },
  { value: "user", label: "Usuarios" },
  { value: "restaurant", label: "Establecimientos" },
  { value: "admin", label: "Administradores" },
];

const STATUSES: Array<{ value: UserStatus | ""; label: string }> = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVE", label: "Activas" },
  { value: "PENDING_PHONE", label: "Sin verificar teléfono" },
  { value: "SUSPENDED", label: "Suspendidas" },
];

const select =
  "h-11 rounded-xl bg-[#eef0ff] px-3 text-sm font-semibold text-[#26344d] outline-none focus:ring-2 focus:ring-[#6868e8]/50";

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Usuarios</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">Busca cuentas, revisa su actividad y suspende o reactiva cuando sea necesario.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-5 lg:flex-row">
        <form onSubmit={handleSearch} role="search" className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-[#eef0ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/50">
          <Search aria-hidden="true" className="size-5 text-[#81869a]" />
          <label htmlFor="admin-user-search" className="sr-only">
            Buscar usuarios
          </label>
          <input
            id="admin-user-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nombre, apodo, correo o teléfono"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#81869a]"
          />
        </form>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="admin-user-role">
            Rol
          </label>
          <select id="admin-user-role" value={role} onChange={(event) => setRole(event.target.value as UserRole | "")} className={select}>
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="admin-user-status">
            Estado
          </label>
          <select id="admin-user-status" value={status} onChange={(event) => setStatus(event.target.value as UserStatus | "")} className={select}>
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <UserPages key={`${search}-${role}-${status}`} search={search} role={role} status={status} />
    </div>
  );
}

function UserPages({ search, role, status }: { search: string; role: UserRole | ""; status: UserStatus | "" }) {
  const [items, setItems] = useState<AdminUserListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (skip: number) => {
      try {
        const page = await listAdminUsers({
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          skip,
          limit: PAGE_SIZE,
        });
        const pageItems = page?.items ?? [];
        setItems((current) => (skip === 0 || !current ? pageItems : [...current, ...pageItems.filter((item) => !current.some((known) => known.id === item.id))]));
        setTotal(page?.total ?? 0);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los usuarios.");
        setItems((current) => current ?? []);
      }
    },
    [search, role, status],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(0));
  }, [load]);

  if (items === null) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-2xl bg-[#e9edff]" />
        ))}
      </div>
    );
  }

  const badge = (user: AdminUserListItem) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${USER_STATUS_CLASS[user.status] ?? "bg-slate-100 text-slate-700"}`}>
      {USER_STATUS_LABEL[user.status] ?? user.status}
    </span>
  );

  const loadMore = async () => {
    setLoadingMore(true);
    await load(items.length);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {items.length === 0 && !error ? (
        <EmptyState icon={Users} title="No hay cuentas con esos filtros" description="Prueba con otra búsqueda o quita los filtros." />
      ) : (
        <ul className="divide-y divide-[#f0f2f8] overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
          {items.map((user) => (
            <li key={user.id}>
              <Link href={`/admin/users/${user.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-[#f8f9ff]">
                <Avatar user={user} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {user.full_name}
                    {user.nickname && <span className="font-normal text-[#6d6e7a]"> · {user.nickname}</span>}
                  </p>
                  <p className="truncate text-xs text-[#6d6e7a]">
                    {user.email} · desde {formatDate(user.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 font-semibold text-[#514ddd]">{ROLE_LABEL[user.role] ?? user.role}</span>
                  {badge(user)}
                  <span className="text-[#6d6e7a]">
                    {user.reviews_count} {user.reviews_count === 1 ? "reseña" : "reseñas"}
                  </span>
                  {user.open_reports_count > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-[#fde0e3] px-2 py-0.5 font-bold text-[#a30f35]">
                      <Flag aria-hidden="true" className="size-3" />
                      {user.open_reports_count}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
