"use client";

import { ArrowRight, Flag, Mail, Phone, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminOverviewMetrics from "@/components/admin/AdminOverviewMetrics";
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

  const [roleTotals, setRoleTotals] = useState<Array<{ label: string; total: number }> | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(ROLES.filter(item => item.value).map(async ({ value, label }) => {
      const page = await listAdminUsers({ role: value || undefined, limit: 1 });
      return { label, total: page?.total ?? 0 };
    })).then(data => { if (active) setRoleTotals(data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Directorio de cuentas</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Usuarios</h1>
        <p className="max-w-2xl text-base text-[#6d6e7a]">Busca cuentas, revisa su actividad y suspende o reactiva cuando sea necesario.</p>
      </header>
      {roleTotals && <section className="hidden space-y-2 rounded-xl bg-white p-4 shadow-sm lg:block">
        <h2 className="text-sm font-bold">Distribución por rol</h2>
        <dl className="space-y-1 text-xs">{roleTotals.map(({ label, total }) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-bold text-[#514ddd]">{total.toLocaleString("es-CO")}</dd></div>)}</dl>
      </section>}
      </div>

      <AdminOverviewMetrics metrics={[
        { key: "users_count", label: "Cuentas registradas", tone: "bg-[#eef0ff] text-[#4039b6]" },
        { key: "suspended_users", label: "Cuentas suspendidas", tone: "bg-[#fdeff2] text-[#a30f35]" },
      ]} />

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
        <div className="grid min-w-0 grid-cols-2 gap-2 [&_select]:w-full">
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
        <>
          <p className="rounded-xl bg-[#eef0ff] px-4 py-2.5 text-sm font-semibold text-[#514ddd]">
            {total} {total === 1 ? "cuenta encontrada" : "cuentas encontradas"}
          </p>
          <div className="xl:overflow-hidden xl:rounded-2xl xl:bg-white xl:shadow-sm">
            <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_0.8fr_0.85fr_auto] gap-3 bg-[#eef2ff] px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#43506a] xl:grid">
              <span>Usuario</span><span>Contacto</span><span>Rol</span><span>Estado</span><span>Detalle</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:block xl:divide-y xl:divide-[#f0f2f8]">
              {items.map((user) => (
                <li key={user.id}>
                  <Link href={`/admin/users/${user.id}`} className="grid h-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:bg-[#f8f9ff] xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_0.8fr_0.85fr_auto] xl:rounded-none xl:shadow-none">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={user} className="size-10 shrink-0" />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold">{user.full_name}</p>
                        {user.nickname && <p className="break-words text-xs text-[#514ddd]">@{user.nickname}</p>}
                        <p className="text-xs text-[#6d6e7a]">Desde {formatDate(user.created_at)}</p>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-1 rounded-lg bg-[#f3f5ff] p-2 text-xs text-[#43506a] xl:bg-transparent xl:p-0">
                      <p className="flex items-start gap-1.5 break-all"><Mail aria-hidden="true" className="size-3.5 shrink-0 text-[#514ddd]" />{user.email}</p>
                      {user.phone_number && <p className="flex items-center gap-1.5"><Phone aria-hidden="true" className="size-3.5 shrink-0 text-[#514ddd]" />{user.phone_number}</p>}
                    </div>
                    <span className="w-fit rounded-full bg-[#eef0ff] px-2.5 py-1 text-xs font-semibold text-[#514ddd]">{ROLE_LABEL[user.role] ?? user.role}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs xl:items-start">
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
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#eef0ff] px-2.5 py-1.5 text-xs font-bold text-[#514ddd]">Ver detalle <ArrowRight aria-hidden="true" className="size-3.5" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <LoadMoreButton loaded={items.length} total={total} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
    </div>
  );
}
