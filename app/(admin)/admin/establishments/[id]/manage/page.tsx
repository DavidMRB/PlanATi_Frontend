"use client";

import { ArrowLeft, Clock, Eye, Image, Package, ShieldAlert, Store, Tags } from "lucide-react";
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
  { value: "profile", label: "Perfil", icon: Store },
  { value: "products", label: "Productos", icon: Package },
  { value: "combos", label: "Combos", icon: Tags },
  { value: "gallery", label: "Fotos", icon: Image },
  { value: "schedules", label: "Horarios", icon: Clock },
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

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eef0ff] text-[#514ddd] sm:size-20">
            {place?.profile_image_url || place?.banner_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- Imagen del establecimiento
              <img src={place.profile_image_url ?? place.banner_image_url ?? ""} alt="" className="size-full object-cover" />
            ) : <Store aria-hidden="true" className="size-6" />}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="break-words text-xl font-extrabold text-[#17243d] sm:text-3xl">{place?.name ?? "Cargando…"}</h1>
              {place && (
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[place.status]}`}>
                  {ESTABLISHMENT_STATUS_LABEL[place.status] ?? place.status}
                </span>
              )}
            </div>
            <p className="text-sm text-[#43506a]">Gestión administrativa del establecimiento</p>
          </div>
        </div>
        {place?.status === "APPROVED" && <Link href={`/establishments/${establishmentId}`} className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-3 py-2 text-sm font-bold text-[#514ddd]"><Eye aria-hidden="true" className="size-4" /> Vista pública</Link>}
      </header>

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
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === item.value ? "bg-[#514ddd] text-white" : "bg-[#eef0ff] text-[#26344d] hover:bg-[#e2e5ff]"
              }`}
          >
            <item.icon aria-hidden="true" className="size-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <aside className="space-y-4 rounded-2xl bg-[#eef0ff] p-4 xl:order-last xl:sticky xl:top-24">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldAlert aria-hidden="true" className="size-5 text-[#514ddd]" /> Auditoría</h2>
          <p className="text-sm text-[#43506a]" role="note">Estás editando como administrador. El establecimiento será notificado.</p>
          <div className="space-y-1.5">
            <label htmlFor="admin-edit-reason" className="text-sm font-semibold text-[#26344d]">
              Motivo de la edición <span className="font-normal">(opcional; se guarda en la bitácora y se envía al dueño con los cambios del perfil)</span>
            </label>
            <textarea
              id="admin-edit-reason"
              rows={4}
              value={reason}
              maxLength={REASON_MAX}
              onChange={(event) => {
                setReason(event.target.value);
                api.setReason(event.target.value);
              }}
              placeholder="Ej.: Corrección de la dirección reportada por usuarios."
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#d7dcf2] focus:ring-2 focus:ring-[#514ddd]"
            />
          </div>
        </aside>
        <div id="manage-panel" role="tabpanel" className="min-w-0" aria-labelledby={`manage-tab-${tab}`}>
          {tab === "profile" && <ProfileEditor api={api} />}
          {tab === "products" && <ProductsManager api={api} />}
          {tab === "combos" && <CombosManager api={api} />}
          {tab === "gallery" && <GalleryManager api={api} />}
          {tab === "schedules" && <SchedulesEditor load={api.getSchedules} save={api.putSchedules} />}
        </div>
      </div>
    </div>
  );
}
