"use client";

import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import {
  approveEstablishment,
  getAdminEstablishment,
  rejectEstablishment,
  type AdminEstablishmentDetail,
} from "@/lib/admin-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";

const REASON_MIN = 5;
const REASON_MAX = 1000;

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

  return (
    <div className="space-y-6">
      <Link href="/admin/establishments" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c4cdd] hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a establecimientos
      </Link>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {!detail && !error && <p className="text-sm text-[#6d6e7a]">Cargando solicitud...</p>}

      {detail && (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{detail.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[detail.status]}`}>
                  {ESTABLISHMENT_STATUS_LABEL[detail.status]}
                </span>
              </div>
              <p className="text-sm text-[#6d6e7a]">{detail.category} · {detail.address}</p>
            </div>

            {detail.status !== "APPROVED" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                >
                  <XCircle aria-hidden="true" className="size-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingApprove(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Aprobar
                </button>
              </div>
            )}
          </header>

          {detail.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-semibold">Motivo del último rechazo:</span> {detail.rejection_reason}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0] lg:col-span-2">
              <h2 className="font-bold">Información del establecimiento</h2>
              <p className="text-sm leading-relaxed text-[#43506a]">{detail.description}</p>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Teléfono" value={detail.phone} />
                <Field label="Correo de contacto" value={detail.contact_email} />
                <Field label="Creado" value={new Date(detail.created_at).toLocaleString("es-CO")} />
              </dl>
            </section>

            <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0]">
              <h2 className="font-bold">Cuenta responsable</h2>
              <dl className="space-y-3 text-sm">
                <Field label="Gerente" value={detail.manager_name} />
                <Field label="Titular" value={detail.owner_full_name} />
                <Field label="Correo de cuenta" value={detail.owner_email} />
                <Field label="Estado de la cuenta" value={detail.owner_status} />
              </dl>
            </section>
          </div>

          <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0]">
            <h2 className="font-bold">Imágenes</h2>
            {detail.profile_image_url || detail.banner_image_url || detail.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[detail.profile_image_url, detail.banner_image_url, ...detail.images.map((image) => image.image_url)]
                  .filter((url): url is string => Boolean(url))
                  .map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img key={url} src={url} alt="" className="aspect-video w-full rounded-xl object-cover" />
                  ))}
              </div>
            ) : (
              <p className="text-sm text-[#6d6e7a]">Este establecimiento no ha subido imágenes.</p>
            )}
          </section>
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
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
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

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#9295a4]">{label}</dt>
      <dd className="mt-1 text-[#17243d]">{value || "—"}</dd>
    </div>
  );
}
