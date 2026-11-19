"use client";

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  Flag,
  History,
  Images,
  Mail,
  MapPin,
  MapPinOff,
  MessageSquare,
  Navigation,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  Store,
  TriangleAlert,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import ConfirmWithReasonModal from "@/components/admin/ConfirmWithReasonModal";
import { StaticLocationMap } from "@/components/map/lazy";
import Modal from "@/components/ui/Modal";
import {
  announceAdminCountsChanged,
  approveEstablishment,
  getAdminEstablishment,
  reactivateEstablishment,
  rejectEstablishment,
  suspendEstablishment,
  type AdminEstablishmentDetail,
} from "@/lib/admin-api";
import { timeAgo } from "@/lib/datetime";
import { ESTABLISHMENT_TYPES, formatRating } from "@/lib/establishments-api";
import { directionsUrl } from "@/lib/geo";
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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [statusDialog, setStatusDialog] = useState<"suspend" | "reactivate" | null>(null);

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
      setWarnings(decision?.warnings ?? []);
      setIsConfirmingApprove(false);
      announceAdminCountsChanged();
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
      setWarnings([]);
      setIsRejecting(false);
      announceAdminCountsChanged();
      setReason("");
      setReloadKey((key) => key + 1);
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "No fue posible rechazar la solicitud.");
    }
  };

  const card = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8";
  // Aprobar y rechazar solo desde PENDING; un local aprobado se suspende y uno rechazado debe re-aplicar.
  const canDecide = detail !== null && detail.status === "PENDING";
  const latitude = detail?.latitude != null ? Number(detail.latitude) : null;
  const longitude = detail?.longitude != null ? Number(detail.longitude) : null;
  const coordinates =
    latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude)
      ? { latitude, longitude }
      : null;
  const statusDot: Record<EstablishmentStatus, string> = {
    PENDING: "bg-amber-500",
    APPROVED: "bg-emerald-600",
    REJECTED: "bg-red-600",
    SUSPENDED: "bg-slate-600",
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
      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      )}
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

          {detail.status === "SUSPENDED" && (
            <section className="flex gap-4 rounded-3xl bg-slate-100 p-5 sm:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <Ban aria-hidden="true" className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Establecimiento suspendido</p>
                <p className="text-sm leading-relaxed text-[#17243d]">
                  No aparece en el directorio ni en el mapa y su panel está bloqueado.
                  {detail.suspension_reason && (
                    <>
                      {" "}
                      <span className="font-bold">Motivo:</span> “{detail.suspension_reason}”
                    </>
                  )}
                </p>
              </div>
            </section>
          )}

          {detail.rejection_reason && detail.status !== "APPROVED" && (
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
                    Recibida {timeAgo(detail.created_at).toLowerCase()}
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
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                      <MapPin aria-hidden="true" className="size-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold">Ubicación y reputación</h2>
                      <p className="text-sm text-[#6d6e7a]">
                        {ESTABLISHMENT_TYPES[detail.establishment_type] ?? detail.establishment_type}
                        {detail.city ? ` · ${detail.city}` : ""}
                        {detail.price_range ? ` · ${detail.price_range}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="flex items-center gap-1 rounded-full bg-[#eef0ff] px-3 py-1">
                      <Star aria-hidden="true" className="size-3.5 fill-[#d6154a] text-[#d6154a]" />
                      {detail.rating_count > 0 ? `${formatRating(detail.rating_avg)} (${detail.rating_count})` : "Sin reseñas"}
                    </span>
                    {detail.open_reports_count > 0 && (
                      <Link
                        href="/admin/reports"
                        className="flex items-center gap-1 rounded-full bg-[#fde0e3] px-3 py-1 text-[#a30f35] hover:underline"
                      >
                        <Flag aria-hidden="true" className="size-3.5" />
                        {detail.open_reports_count} {detail.open_reports_count === 1 ? "reporte abierto" : "reportes abiertos"}
                      </Link>
                    )}
                  </div>
                </div>
                {coordinates ? (
                  <div className="space-y-3">
                    <StaticLocationMap
                      latitude={coordinates.latitude}
                      longitude={coordinates.longitude}
                      name={detail.name}
                      establishmentType={detail.establishment_type}
                      className="h-56 overflow-hidden rounded-2xl"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6d6e7a]">
                      <span>
                        {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                        {detail.location_source ? ` · origen: ${detail.location_source}` : ""}
                      </span>
                      <a
                        href={directionsUrl(coordinates.latitude, coordinates.longitude, detail.google_place_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-semibold text-[#514ddd] hover:underline"
                      >
                        <Navigation aria-hidden="true" className="size-3.5" />
                        Abrir en Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <MapPinOff aria-hidden="true" className="size-4 shrink-0" />
                    Sin ubicación: no aparece en el mapa ni en “Cerca de mí”.
                  </p>
                )}
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

              <section className={`${card} space-y-3`}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#6d6e7a]">Administración</h2>
                <Link
                  href={`/admin/establishments/${detail.id}/manage`}
                  className="flex items-center gap-2 rounded-xl bg-[#514ddd] px-4 py-3 text-sm font-bold text-white hover:bg-[#4542ca]"
                >
                  <Wrench aria-hidden="true" className="size-4" />
                  Gestionar como establecimiento
                </Link>
                <Link
                  href={`/admin/reviews?establishment_id=${detail.id}`}
                  className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-3 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                >
                  <MessageSquare aria-hidden="true" className="size-4" />
                  Ver sus reseñas
                </Link>
                <Link
                  href={`/admin/users/${detail.owner_id}`}
                  className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-3 text-sm font-semibold text-[#514ddd] hover:bg-[#e2e5ff]"
                >
                  <UserRound aria-hidden="true" className="size-4" />
                  Ver la cuenta dueña
                </Link>
                {detail.status === "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => setStatusDialog("suspend")}
                    className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <Ban aria-hidden="true" className="size-4" />
                    Suspender establecimiento
                  </button>
                )}
                {detail.status === "SUSPENDED" && (
                  <button
                    type="button"
                    onClick={() => setStatusDialog("reactivate")}
                    className="flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Reactivar establecimiento
                  </button>
                )}
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
            Al aprobarlo, el establecimiento podrá acceder a su panel y aparecerá en el directorio público.
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

      {statusDialog === "suspend" && detail && (
        <ConfirmWithReasonModal
          title={`Suspender ${detail.name}`}
          description="Desaparece del directorio y del mapa, su panel queda bloqueado y el dueño recibe el motivo. Puedes reactivarlo después."
          confirmLabel="Suspender"
          placeholder="Ej.: Varias reseñas confirman cobros indebidos."
          onClose={() => setStatusDialog(null)}
          onConfirm={async (text) => {
            const decision = await suspendEstablishment(establishmentId, text);
            setStatusDialog(null);
            setWarnings([]);
            setMessage(decision?.message ?? "Establecimiento suspendido.");
            setReloadKey((key) => key + 1);
          }}
        />
      )}
      {statusDialog === "reactivate" && detail && (
        <ConfirmWithReasonModal
          title={`Reactivar ${detail.name}`}
          description="Vuelve a aparecer en el directorio y en el mapa, y recupera su panel."
          confirmLabel="Reactivar"
          reasonLabel="Nota para el dueño"
          required={false}
          tone="primary"
          onClose={() => setStatusDialog(null)}
          onConfirm={async (note) => {
            const decision = await reactivateEstablishment(establishmentId, note);
            setStatusDialog(null);
            setMessage(decision?.message ?? "Establecimiento reactivado.");
            setReloadKey((key) => key + 1);
          }}
        />
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
              placeholder="Explica qué debe corregir el establecimiento"
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
