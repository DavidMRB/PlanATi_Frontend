"use client";

import { ArrowLeft, CheckCircle2, Copy, History, Images, Mail, MapPin, Phone, ShieldCheck, Store, XCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  approveEstablishment,
  getAdminEstablishment,
  rejectEstablishment,
  type AdminEstablishmentDetail,
} from "@/lib/admin-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import type { EstablishmentStatus } from "@/lib/restaurant-api";

const REASON_MIN = 5;
const REASON_MAX = 1000;

const IMAGE_TYPE_LABEL: Record<string, string> = { GALLERY: "Galería", MENU: "Carta", PROFILE: "Perfil", BANNER: "Portada" };

function initials(name: string | null | undefined) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

// "hace 2 h", "hace 3 días": solo para la etiqueta de recepción.
function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

export default function AdminEstablishmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const establishmentId = Number(id);

  const [detail, setDetail] = useState<AdminEstablishmentDetail | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(() =>
    Number.isNaN(establishmentId) ? "Identificador de establecimiento no válido." : "",
  );
  const [message, setMessage] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (Number.isNaN(establishmentId)) return;
    let cancelled = false;
    getAdminEstablishment(establishmentId)
      .then((data) => {
        if (!cancelled) setDetail(data ?? null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la solicitud.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [establishmentId, reloadKey]);

  const handleApprove = async () => {
    setIsApproving(true);
    setError("");
    try {
      const decision = await approveEstablishment(establishmentId);
      setMessage(decision?.message ?? "Establecimiento aprobado.");
      setIsConfirmingApprove(false);
      setReloadKey((key) => key + 1);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "No fue posible aprobar la solicitud.");
    } finally {
      setIsApproving(false);
    }
  };

  const reasonIsValid = reason.trim().length >= REASON_MIN && reason.trim().length <= REASON_MAX;

  const handleReject = async () => {
    if (!reasonIsValid) return;
    setError("");
    try {
      const decision = await rejectEstablishment(establishmentId, reason.trim());
      setMessage(decision?.message ?? "Solicitud rechazada.");
      setIsRejecting(false);
      setReason("");
      setReloadKey((key) => key + 1);
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "No fue posible rechazar la solicitud.");
    }
  };

  const card = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8";
  const canDecide = detail !== null && detail.status !== "APPROVED";
  const statusDot: Record<EstablishmentStatus, string> = {
    PENDING: "bg-amber-500",
    APPROVED: "bg-emerald-600",
    REJECTED: "bg-red-600",
  };

  const decisionButtons = (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmingApprove(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.28)] hover:bg-[#4542ca]"
      >
        <CheckCircle2 aria-hidden="true" className="size-4" />
        Aprobar establecimiento
      </button>
      <button
        type="button"
        onClick={() => setIsRejecting(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#fde0e3] px-5 py-3.5 text-sm font-bold text-[#a30f35] hover:bg-[#fbd0d5]"
      >
        <XCircle aria-hidden="true" className="size-4" />
        Rechazar solicitud
      </button>
    </>
  );

  return (
    <div className={`space-y-6 ${canDecide ? "pb-24 lg:pb-0" : ""}`}>
      <Link href="/admin/establishments" className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd] hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a establecimientos
      </Link>

      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}
      {message && <p className="rounded-2xl bg-[#c6f7f0] px-5 py-4 text-sm font-semibold text-[#0b6b5c]">{message}</p>}
      {!detail && !error && (
        <div className="space-y-4">
          <div className="h-12 w-72 animate-pulse rounded-xl bg-[#e9edff]" />
          <div className="h-64 animate-pulse rounded-3xl bg-[#e9edff]" />
        </div>
      )}

      {detail && (
        <>
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold sm:text-4xl">{detail.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[detail.status]}`}>
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${statusDot[detail.status]}`} />
                  {ESTABLISHMENT_STATUS_LABEL[detail.status]}
                </span>
                <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-semibold text-[#26344d]">ID: EST-{detail.id}</span>
              </div>
            </div>

            {canDecide && <div className="hidden gap-3 lg:flex [&>button]:py-3">{decisionButtons}</div>}
          </header>

          {detail.rejection_reason && (
            <section className="flex gap-4 rounded-3xl bg-[#e4ebff] p-5 sm:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d9dcf6] text-[#514ddd]">
                <History aria-hidden="true" className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#a30f35]">Historial previo: rechazado</p>
                <p className="text-sm leading-relaxed text-[#17243d]">
                  <span className="font-bold">Motivo informado al comerciante:</span> “{detail.rejection_reason}”
                </p>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <section className={`${card} space-y-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                      <Store aria-hidden="true" className="size-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold">Ficha técnica del establecimiento</h2>
                      <p className="text-sm text-[#6d6e7a]">Datos declarados para el directorio público de PlanATi</p>
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#26344d] sm:inline">
                    Recibida {timeAgo(detail.created_at)}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f3f5ff] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d6e7a]">Categoría principal</p>
                    <p className="mt-1 font-bold">{detail.category}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f3f5ff] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d6e7a]">Fecha de registro</p>
                    <p className="mt-1 font-bold">{new Date(detail.created_at).toLocaleString("es-CO")}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f3f5ff] p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6d6e7a]">
                    <MapPin aria-hidden="true" className="size-3.5 text-[#514ddd]" />
                    Dirección física registrada
                  </p>
                  <p className="mt-1 font-bold">{detail.address}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d6e7a]">Descripción comercial del negocio</p>
                  <p className="rounded-2xl bg-[#f3f5ff] p-5 text-base leading-relaxed text-[#26344d]">“{detail.description}”</p>
                </div>
              </section>

              <section className={`${card} space-y-5`}>
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#c6f7f0] text-[#0b6b5c]">
                    <Images aria-hidden="true" className="size-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">
                      Galería multimedia adjunta (
                      {[detail.profile_image_url, detail.banner_image_url].filter(Boolean).length + detail.images.length})
                    </h2>
                    <p className="text-sm text-[#6d6e7a]">Archivos fotográficos enviados para el carrusel de la app</p>
                  </div>
                </div>
                {detail.profile_image_url || detail.banner_image_url || detail.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      detail.profile_image_url && { url: detail.profile_image_url, label: "Perfil", badge: "Principal" },
                      detail.banner_image_url && { url: detail.banner_image_url, label: "Portada", badge: null },
                      ...detail.images.map((image) => ({
                        url: image.image_url,
                        label: image.caption || IMAGE_TYPE_LABEL[image.image_type] || image.image_type,
                        badge: null,
                      })),
                    ]
                      .filter((item): item is { url: string; label: string; badge: string | null } => Boolean(item))
                      .map((item) => (
                        <figure key={item.url} className="relative aspect-square overflow-hidden rounded-2xl bg-[#17243d]">
                          {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
                          <img src={item.url} alt="" className="size-full object-cover" />
                          {item.badge && (
                            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs font-bold text-white">
                            {item.label}
                          </figcaption>
                        </figure>
                      ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#f3f5ff] p-6 text-center text-sm text-[#6d6e7a]">Este establecimiento no ha subido imágenes.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className={`${card} space-y-5`}>
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-sm font-extrabold text-[#514ddd]">
                    {initials(detail.manager_name ?? detail.owner_full_name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold leading-tight">{detail.manager_name ?? detail.owner_full_name}</h2>
                    <p className="text-sm text-[#6d6e7a]">{detail.manager_name ? "Gerente responsable" : "Titular de la cuenta"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl bg-[#f3f5ff] px-4 py-3">
                  <span className="flex min-w-0 items-center gap-3 text-sm font-semibold">
                    <Mail aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
                    <span className="truncate">{detail.owner_email}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Copiar correo"
                    onClick={() => void navigator.clipboard?.writeText(detail.owner_email)}
                    className="shrink-0 text-[#514ddd] hover:text-[#4542ca]"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </button>
                </div>

                {detail.phone && (
                  <a
                    href={`tel:${detail.phone}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm font-semibold hover:bg-[#e9edff]"
                  >
                    <span className="flex items-center gap-3">
                      <Phone aria-hidden="true" className="size-4 text-[#0b6b5c]" />
                      {detail.phone}
                    </span>
                    <span className="rounded-md bg-[#5df0dc] px-2 py-0.5 text-[11px] font-bold text-[#0b6b5c]">Llamar</span>
                  </a>
                )}

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f3f5ff] p-3">
                    <dt className="text-[11px] text-[#6d6e7a]">Titular</dt>
                    <dd className="mt-1 text-sm font-bold">{detail.owner_full_name || "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-[#f3f5ff] p-3">
                    <dt className="text-[11px] text-[#6d6e7a]">Estado de la cuenta</dt>
                    <dd className="mt-1 text-sm font-bold">{detail.owner_status || "—"}</dd>
                  </div>
                </dl>

                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#6d6e7a]">Correo de contacto:</dt>
                    <dd className="min-w-0 truncate font-semibold">{detail.contact_email || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#6d6e7a]">Radicado inicial:</dt>
                    <dd className="font-semibold">{new Date(detail.created_at).toLocaleDateString("es-CO")}</dd>
                  </div>
                </dl>
              </section>

              {canDecide && (
                <section className="hidden space-y-4 rounded-3xl bg-[#e4e6fb] p-6 lg:block">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-[#514ddd]">
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    Dictamen del superadmin
                  </h2>
                  <p className="text-sm leading-relaxed text-[#43506a]">
                    Revise minuciosamente la información y las imágenes antes de emitir la aprobación pública.
                  </p>
                  <div className="flex flex-col gap-3">{decisionButtons}</div>
                </section>
              )}
            </aside>
          </div>

          {canDecide && (
            <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-[#e4e6f0] bg-white/95 p-4 backdrop-blur lg:hidden">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#fde0e3] px-4 py-3 text-sm font-bold text-[#a30f35]"
              >
                <XCircle aria-hidden="true" className="size-4" />
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingApprove(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6b5c] px-4 py-3 text-sm font-bold text-white"
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Aprobar
              </button>
            </div>
          )}
        </>
      )}

      {isConfirmingApprove && (
        <Modal title="Aprobar establecimiento" onClose={() => setIsConfirmingApprove(false)}>
          <p className="text-sm text-[#43506a]">
            Al aprobarlo, el restaurante podrá acceder a su panel y aparecerá en el directorio público.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsConfirmingApprove(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={isApproving}
              className="rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-60"
            >
              {isApproving ? "Aprobando..." : "Confirmar aprobación"}
            </button>
          </div>
        </Modal>
      )}

      {isRejecting && (
        <Modal title="Rechazar solicitud" onClose={() => setIsRejecting(false)}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#26344d]">Motivo del rechazo</span>
            <textarea
              rows={4}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40"
              placeholder="Explica qué debe corregir el restaurante"
            />
            <span className="block text-xs text-[#6d6e7a]">
              Entre {REASON_MIN} y {REASON_MAX} caracteres.
            </span>
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsRejecting(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={!reasonIsValid}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Rechazar solicitud
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
