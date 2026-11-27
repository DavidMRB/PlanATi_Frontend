"use client";

import { ArrowLeft, Ban, BellRing, Flag, History, Mail, MessageSquare, Phone, RotateCcw, Shield, Store } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import ConfirmWithReasonModal from "@/components/admin/ConfirmWithReasonModal";
import ModerationReviewCard from "@/components/admin/ModerationReviewCard";
import NotifyUserModal from "@/components/admin/NotifyUserModal";
import { useAuth } from "@/components/providers/AuthProvider";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import {
  getAdminUser,
  MODERATION_ACTION_LABEL,
  reactivateUser,
  suspendEstablishment,
  suspendUser,
  TARGET_TYPE_LABEL,
  updateUserRole,
  type AdminUserDetail,
  type UserRole,
} from "@/lib/admin-api";
import { formatDate, formatDateTime, timeAgo } from "@/lib/datetime";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL, ROLE_LABEL, USER_STATUS_CLASS, USER_STATUS_LABEL } from "@/lib/format";
import { REPORT_REASON_LABEL, type ReportReason } from "@/lib/reports-api";

const card = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)]";
const REPORT_STATUS: Record<string, string> = { OPEN: "Abierto", RESOLVED: "Resuelto", DISMISSED: "Descartado" };

type Dialog = "suspend" | "reactivate" | "role" | "notify" | null;

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = Number(id);
  const { user: me } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState(() => (Number.isNaN(userId) ? "Identificador de usuario no válido." : ""));
  const [message, setMessage] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [alsoSuspendPlace, setAlsoSuspendPlace] = useState(true);

  const load = useCallback(async () => {
    if (Number.isNaN(userId)) return;
    try {
      setDetail((await getAdminUser(userId)) ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la cuenta.");
    }
  }, [userId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const isSelf = me?.id === userId;
  const isRestaurant = detail?.role === "restaurant";
  const suspended = detail?.status === "SUSPENDED";
  const approvedPlace = detail?.establishments.find((place) => place.status === "APPROVED");

  const after = async (text: string) => {
    setDialog(null);
    setMessage(text);
    await load();
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd] hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a usuarios
      </Link>

      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {message && (
        <p role="status" className="rounded-2xl bg-[#c6f7f0] px-5 py-4 text-sm font-semibold text-[#0b6b5c]">
          {message}
        </p>
      )}
      {!detail && !error && <div className="h-64 animate-pulse rounded-3xl bg-[#e9edff]" />}

      {detail && (
        <>
          <header className={`${card} flex flex-col gap-6 bg-gradient-to-br from-white to-[#f1f3ff] sm:p-8 lg:flex-row lg:items-start lg:justify-between`}>
            <div className="flex min-w-0 items-start gap-4">
              <Avatar user={detail} className="size-16 text-lg" />
              <div className="min-w-0 space-y-2">
                <h1 className="text-2xl font-extrabold sm:text-3xl">{detail.full_name}</h1>
                {detail.nickname && <p className="text-sm text-[#6d6e7a]">Apodo público: {detail.nickname}</p>}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[#514ddd]">{ROLE_LABEL[detail.role] ?? detail.role}</span>
                  <span className={`rounded-full px-2.5 py-1 ${USER_STATUS_CLASS[detail.status] ?? ""}`}>{USER_STATUS_LABEL[detail.status] ?? detail.status}</span>
                  {isSelf && <span className="rounded-full bg-[#fff4d6] px-2.5 py-1 text-[#8a5a00]">Tu cuenta</span>}
                </div>
                <ul className="space-y-1 rounded-xl bg-[#eef0ff] p-3 text-sm text-[#43506a]">
                  <li className="flex items-center gap-2">
                    <Mail aria-hidden="true" className="size-4 text-[#514ddd]" />
                    {detail.email}
                    {detail.google_sub && <span className="text-xs text-[#6d6e7a]">(Google)</span>}
                  </li>
                  {detail.phone_number && (
                    <li className="flex items-center gap-2">
                      <Phone aria-hidden="true" className="size-4 text-[#514ddd]" />
                      {detail.phone_number}
                      <span className="text-xs text-[#6d6e7a]">{detail.phone_verified ? "verificado" : "sin verificar"}</span>
                    </li>
                  )}
                  <li className="text-xs text-[#6d6e7a]">Cuenta creada el {formatDate(detail.created_at)}</li>
                </ul>
              </div>
            </div>

            {/* Acciones: se ocultan las que el backend no permite sobre la propia cuenta. */}
            {!isSelf && (
              <div className="flex flex-wrap gap-2 lg:max-w-xs lg:flex-col">
                {!isRestaurant && (
                  <button
                    type="button"
                    onClick={() => setDialog("role")}
                    className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-2.5 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                  >
                    <Shield aria-hidden="true" className="size-4" />
                    Cambiar rol
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDialog("notify")}
                  className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-2.5 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                >
                  <BellRing aria-hidden="true" className="size-4" />
                  Enviar aviso
                </button>
                {suspended ? (
                  <button
                    type="button"
                    onClick={() => setDialog("reactivate")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Reactivar cuenta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDialog("suspend")}
                    className="flex items-center gap-2 rounded-xl bg-[#fde0e3] px-4 py-2.5 text-sm font-bold text-[#a30f35] hover:bg-rose-200"
                  >
                    <Ban aria-hidden="true" className="size-4" />
                    Suspender cuenta
                  </button>
                )}
              </div>
            )}
          </header>

          {suspended && (
            <section className="rounded-3xl bg-slate-100 p-5 text-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Suspendida{detail.suspended_at ? ` el ${formatDateTime(detail.suspended_at)}` : ""}
              </p>
              {detail.suspension_reason && <p className="mt-1 text-[#17243d]">Motivo: “{detail.suspension_reason}”</p>}
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MessageSquare aria-hidden="true" className="size-5 text-[#514ddd]" />
                Reseñas recientes
                <span className="text-sm font-normal text-[#6d6e7a]">({detail.reviews_count} en total)</span>
              </h2>
              {detail.recent_reviews.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-[#6d6e7a] shadow-[0_4px_16px_rgba(23,36,61,0.06)]">No ha publicado reseñas.</p>
              ) : (
                <ul className="space-y-4">
                  {detail.recent_reviews.map((review) => (
                    <ModerationReviewCard
                      key={review.id}
                      review={review}
                      onChange={(updated, text) => {
                        setMessage(text);
                        setDetail((current) =>
                          current && {
                            ...current,
                            recent_reviews: updated
                              ? current.recent_reviews.map((item) => (item.id === updated.id ? updated : item))
                              : current.recent_reviews.filter((item) => item.id !== review.id),
                          },
                        );
                      }}
                    />
                  ))}
                </ul>
              )}
              {detail.reviews_count > detail.recent_reviews.length && (
                <Link href={`/admin/reviews?user_id=${detail.id}`} className="inline-block text-sm font-semibold text-[#514ddd] hover:underline">
                  Ver todas sus reseñas
                </Link>
              )}
            </section>

            <aside className="space-y-6">
              {detail.establishments.length > 0 && (
                <section className={`${card} space-y-3`}>
                  <h2 className="flex items-center gap-2 font-bold">
                    <Store aria-hidden="true" className="size-4 text-[#514ddd]" />
                    Establecimientos
                  </h2>
                  <ul className="space-y-2">
                    {detail.establishments.map((place) => (
                      <li key={place.id}>
                        <Link href={`/admin/establishments/${place.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm hover:bg-[#e9edff]">
                          <span className="truncate font-semibold">{place.name}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[place.status] ?? ""}`}>
                            {ESTABLISHMENT_STATUS_LABEL[place.status] ?? place.status}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className={`${card} space-y-3`}>
                <h2 className="flex items-center gap-2 font-bold">
                  <Flag aria-hidden="true" className="size-4 text-[#d6154a]" />
                  Reportes recibidos
                  {detail.open_reports_count > 0 && (
                    <span className="rounded-full bg-[#fde0e3] px-2 py-0.5 text-xs text-[#a30f35]">{detail.open_reports_count} abiertos</span>
                  )}
                </h2>
                {detail.reports_received.length === 0 ? (
                  <p className="text-sm text-[#6d6e7a]">Sin reportes.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {detail.reports_received.map((report) => (
                      <li key={report.id} className="rounded-xl bg-[#f8f9ff] px-4 py-3">
                        <p className="font-semibold">
                          {REPORT_REASON_LABEL[report.reason as ReportReason] ?? report.reason}
                          <span className="font-normal text-[#6d6e7a]"> · {TARGET_TYPE_LABEL[report.target_type] ?? report.target_type}</span>
                        </p>
                        <p className="text-xs text-[#6d6e7a]">
                          {REPORT_STATUS[report.status] ?? report.status} · {timeAgo(report.created_at)}
                        </p>
                        {report.details && <p className="mt-1 text-xs text-[#43506a]">“{report.details}”</p>}
                      </li>
                    ))}
                  </ul>
                )}
                {detail.open_reports_count > 0 && (
                  <Link href="/admin/reports" className="inline-block text-sm font-semibold text-[#514ddd] hover:underline">
                    Ir a la cola de reportes
                  </Link>
                )}
              </section>

              <section className={`${card} space-y-3`}>
                <h2 className="flex items-center gap-2 font-bold">
                  <History aria-hidden="true" className="size-4 text-[#514ddd]" />
                  Historial de moderación
                </h2>
                {detail.moderation_history.length === 0 ? (
                  <p className="text-sm text-[#6d6e7a]">Sin acciones de moderación sobre esta cuenta.</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {detail.moderation_history.map((action) => (
                      <li key={action.id} className="rounded-xl bg-[#f8f9ff] px-4 py-3">
                        <p className="font-semibold">{MODERATION_ACTION_LABEL[action.action] ?? action.action}</p>
                        <p className="text-xs text-[#6d6e7a]">
                          {action.admin_name ?? "Automático"} · {timeAgo(action.created_at)}
                        </p>
                        {action.reason && <p className="mt-1 text-xs text-[#43506a]">“{action.reason}”</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </aside>
          </div>
        </>
      )}

      {dialog === "suspend" && detail && (
        <ConfirmWithReasonModal
          title="Confirmar suspensión de cuenta"
          description={
            <div className="space-y-3">
              <p>Esta acción restringirá su acceso a PlanATi. La cuenta recibirá el motivo de la suspensión.</p>
              <div className="flex items-center gap-3 rounded-xl bg-[#eef0ff] p-3">
                <Avatar user={detail} className="size-9 shrink-0" />
                <div className="min-w-0">
                  <p className="break-words font-bold">{detail.full_name}{detail.nickname && ` (@${detail.nickname})`}</p>
                  <p className="text-xs">{ROLE_LABEL[detail.role] ?? detail.role}{approvedPlace && ` · ${approvedPlace.name}`}</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="Confirmar suspensión"
          reasonLabel="Motivo de la suspensión"
          placeholder="Describe brevemente el motivo administrativo de la suspensión."
          featured
          extra={
            isRestaurant && approvedPlace ? (
              <label className="flex items-start gap-2 rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={alsoSuspendPlace}
                  onChange={(event) => setAlsoSuspendPlace(event.target.checked)}
                  className="mt-0.5 size-4 accent-[#514ddd]"
                />
                <span>
                  Suspender también su establecimiento <span className="font-semibold">{approvedPlace.name}</span> (sale del directorio y
                  del mapa).
                </span>
              </label>
            ) : undefined
          }
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            await suspendUser(detail.id, reason);
            let text = "Cuenta suspendida.";
            if (isRestaurant && approvedPlace && alsoSuspendPlace) {
              try {
                await suspendEstablishment(approvedPlace.id, reason);
                text = "Cuenta y establecimiento suspendidos.";
              } catch (placeError) {
                text = `Cuenta suspendida, pero no se pudo suspender el establecimiento: ${
                  placeError instanceof Error ? placeError.message : "error desconocido"
                }`;
              }
            }
            await after(text);
          }}
        />
      )}
      {dialog === "reactivate" && detail && (
        <ConfirmWithReasonModal
          title={`Reactivar a ${detail.full_name}`}
          description={
            isRestaurant
              ? "La cuenta podrá iniciar sesión otra vez. Si su establecimiento está suspendido, reactívalo desde su ficha."
              : "La cuenta podrá iniciar sesión otra vez (si no había verificado su teléfono, tendrá que hacerlo)."
          }
          confirmLabel="Reactivar"
          reasonLabel="Nota para el usuario"
          required={false}
          tone="primary"
          onClose={() => setDialog(null)}
          onConfirm={async (note) => {
            await reactivateUser(detail.id, note);
            await after("Cuenta reactivada.");
          }}
        />
      )}
      {dialog === "role" && detail && (
        <RoleModal
          current={detail.role as UserRole}
          name={detail.full_name}
          onClose={() => setDialog(null)}
          onSave={async (role) => {
            await updateUserRole(detail.id, role);
            await after(`Rol actualizado a ${ROLE_LABEL[role]}.`);
          }}
        />
      )}
      {dialog === "notify" && detail && (
        <NotifyUserModal userId={detail.id} userName={detail.full_name} onClose={() => setDialog(null)} onSent={() => void after("Aviso enviado.")} />
      )}
    </div>
  );
}

// Solo se elige entre usuario y administrador: el rol "restaurant" va ligado a su establecimiento.
function RoleModal({
  current,
  name,
  onClose,
  onSave,
}: {
  current: UserRole;
  name: string;
  onClose: () => void;
  onSave: (role: UserRole) => Promise<void>;
}) {
  const [role, setRole] = useState<UserRole>(current === "admin" ? "admin" : "user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(role);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible cambiar el rol.");
      setBusy(false);
    }
  };

  return (
    <Modal title={`Rol de ${name}`} onClose={busy ? () => undefined : onClose}>
      <fieldset className="space-y-2">
        <legend className="sr-only">Rol</legend>
        {(["user", "admin"] as const).map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              role === value ? "border-[#514ddd] bg-[#eef0ff]" : "border-[#e4e6f0]"
            }`}
          >
            <input type="radio" name="role" checked={role === value} onChange={() => setRole(value)} className="mt-0.5 accent-[#514ddd]" />
            <span>
              <span className="font-semibold">{ROLE_LABEL[value]}</span>
              <span className="block text-xs text-[#6d6e7a]">
                {value === "admin" ? "Acceso completo a la consola de administración." : "Puede reseñar y planear visitas."}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || role === current}
          className="rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-50"
        >
          Guardar rol
        </button>
      </div>
    </Modal>
  );
}
