"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import CombosManager from "@/components/establishment-management/CombosManager";
import GalleryManager from "@/components/establishment-management/GalleryManager";
import ProductsManager from "@/components/establishment-management/ProductsManager";
import ProfileEditor from "@/components/establishment-management/ProfileEditor";
import SchedulesEditor from "@/components/establishment-management/SchedulesEditor";
import { getAdminEstablishment, REASON_MAX, type AdminEstablishmentDetail } from "@/lib/admin-api";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import { adminManagementApi } from "@/lib/management-api";

const TABS = [
  { value: "profile", label: "Perfil" },
  { value: "products", label: "Productos" },
  { value: "combos", label: "Combos" },
  { value: "gallery", label: "Fotos" },
  { value: "schedules", label: "Horarios" },
] as const;

type Tab = (typeof TABS)[number]["value"];

// El admin edita el local con las mismas pantallas del panel del restaurante, sobre /admin/establishments/{id}/*.
// Cada cambio queda en la bitácora y el dueño recibe un aviso (el del catálogo, uno por día).
export default function AdminManageEstablishmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const establishmentId = Number(id);
  const [tab, setTab] = useState<Tab>("profile");
  const [place, setPlace] = useState<AdminEstablishmentDetail | null>(null);
  const [error, setError] = useState(() => (Number.isInteger(establishmentId) ? "" : "Identificador de establecimiento no válido."));
  const [reason, setReason] = useState("");
  // Una sola instancia por local: recrearla recargaría las pantallas. El motivo se le pasa al escribirlo.
  const api = useMemo(() => adminManagementApi(establishmentId), [establishmentId]);

  useEffect(() => {
    if (!Number.isInteger(establishmentId)) return;
    getAdminEstablishment(establishmentId)
      .then((data) => setPlace(data ?? null))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el establecimiento."));
  }, [establishmentId]);

  if (error) {
    return <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Link href={`/admin/establishments/${establishmentId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#514ddd] hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la ficha
      </Link>

      <div className="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <p className="flex items-start gap-2 text-sm font-bold text-amber-900" role="note">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Estás editando como administrador. El establecimiento será notificado.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-lg font-extrabold text-[#17243d]">{place?.name ?? "Cargando…"}</p>
          {place && (
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[place.status]}`}>
              {ESTABLISHMENT_STATUS_LABEL[place.status] ?? place.status}
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="admin-edit-reason" className="text-sm font-semibold text-amber-900">
            Motivo de la edición <span className="font-normal">(opcional; se guarda en la bitácora y se envía al dueño con los cambios del perfil)</span>
          </label>
          <input
            id="admin-edit-reason"
            value={reason}
            maxLength={REASON_MAX}
            onChange={(event) => {
              setReason(event.target.value);
              api.setReason(event.target.value);
            }}
            placeholder="Ej.: Corrección de la dirección reportada por usuarios."
            className="h-11 w-full rounded-xl bg-white px-4 text-sm outline-none ring-2 ring-amber-200 focus:ring-amber-400"
          />
        </div>
      </div>

      <div role="tablist" aria-label="Secciones del establecimiento" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`manage-tab-${item.value}`}
            aria-selected={tab === item.value}
            aria-controls="manage-panel"
            onClick={() => setTab(item.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === item.value ? "bg-[#514ddd] text-white" : "bg-white text-[#26344d] shadow-[0_2px_8px_rgba(23,36,61,0.06)] hover:bg-[#eef0ff]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div id="manage-panel" role="tabpanel" aria-labelledby={`manage-tab-${tab}`}>
        {tab === "profile" && <ProfileEditor api={api} />}
        {tab === "products" && <ProductsManager api={api} />}
        {tab === "combos" && <CombosManager api={api} />}
        {tab === "gallery" && <GalleryManager api={api} />}
        {tab === "schedules" && <SchedulesEditor load={api.getSchedules} save={api.putSchedules} />}
      </div>
    </div>
  );
}
