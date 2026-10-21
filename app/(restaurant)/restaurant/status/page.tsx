"use client";

import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import LogoutButton from "@/components/common/LogoutButton";
import BrandMark from "@/components/ui/BrandMark";
import { ApiError } from "@/lib/auth-api";
import {
  getRestaurantProfile,
  getRestaurantStatus,
  reapplyRestaurant,
  type RestaurantProfileUpdate,
  type RestaurantStatus,
} from "@/lib/restaurant-api";

type ReapplyForm = {
  name: string;
  category: string;
  address: string;
  phone: string;
  contact_email: string;
  manager_name: string;
  description: string;
  profile_image_url: string | null;
  banner_image_url: string | null;
};

const EMPTY_FORM: ReapplyForm = {
  name: "",
  category: "",
  address: "",
  phone: "",
  contact_email: "",
  manager_name: "",
  description: "",
  profile_image_url: null,
  banner_image_url: null,
};

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

export default function RestaurantStatusPage() {
  const [restaurant, setRestaurant] = useState<RestaurantStatus | null>(null);
  const [form, setForm] = useState<ReapplyForm>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRestaurantStatus()
      .then((status) => {
        if (!cancelled) setRestaurant(status ?? null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el estado.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refreshStatus = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  // Precarga el formulario de corrección con los datos actuales del establecimiento.
  const startEditing = async () => {
    setError("");
    setMessage("");
    try {
      const profile = await getRestaurantProfile();
      if (profile) {
        setForm({
          name: profile.name,
          category: profile.category,
          address: profile.address,
          phone: (profile.phone ?? "").replace(/\D/g, "").slice(-10),
          contact_email: profile.contact_email ?? "",
          manager_name: profile.manager_name ?? "",
          description: profile.description,
          profile_image_url: profile.profile_image_url,
          banner_image_url: profile.banner_image_url,
        });
      }
      setIsEditing(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los datos.");
    }
  };

  const handleReapply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const payload: RestaurantProfileUpdate = {
        ...form,
        phone: form.phone ? `+57${form.phone}` : null,
      };
      const response = await reapplyRestaurant(payload);
      setMessage(response?.message ?? "Tu solicitud fue enviada a revisión.");
      setIsEditing(false);
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 409) {
        setError("Este correo de cuenta ya se encuentra registrado.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "No fue posible reenviar la solicitud.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRejected = restaurant?.status === "REJECTED";

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] px-5 py-10 text-[#17243d]">
      <section className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(38,47,99,0.12)] sm:p-10">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LogoutButton />
        </div>

        {isLoading && <p className="text-sm text-[#6d6e7a]">Consultando el estado de tu solicitud...</p>}

        {!isLoading && restaurant && (
          <>
            <header className="space-y-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#eef2ff] text-[#4c4cdd]">
                {isRejected ? <AlertCircle className="size-6" aria-hidden="true" /> : <Clock className="size-6" aria-hidden="true" />}
              </div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-[#6d6e7a]">
                {isRejected
                  ? "Tu solicitud fue rechazada. Corrige los datos indicados y vuelve a enviarla a revisión."
                  : "Tu solicitud está en revisión. Un administrador la revisará pronto; te daremos acceso a tu panel cuando sea aprobada."}
              </p>
            </header>

            {isRejected && restaurant.rejection_reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
                <p className="font-semibold text-red-700">Motivo del rechazo</p>
                <p className="mt-1 text-red-700">{restaurant.rejection_reason}</p>
              </div>
            )}

            {message && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {message}
              </p>
            )}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            {!isEditing && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={refreshStatus}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#4c4cdd] ring-1 ring-[#c9cdf4] hover:bg-[#f8f8ff]"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Actualizar estado
                </button>
                {isRejected && (
                  <button
                    type="button"
                    onClick={() => void startEditing()}
                    className="rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
                  >
                    Modificar datos de la solicitud
                  </button>
                )}
              </div>
            )}

            {isEditing && (
              <form onSubmit={handleReapply} className="grid gap-4 sm:grid-cols-2" noValidate>
                {(
                  [
                    ["name", "Nombre del establecimiento"],
                    ["manager_name", "Nombre del gerente"],
                    ["category", "Categoría"],
                    ["address", "Dirección"],
                    ["contact_email", "Correo de contacto"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="block space-y-1.5">
                    <span className="text-sm font-semibold text-[#26344d]">{label}</span>
                    <input
                      required
                      className={inputClass}
                      value={form[field]}
                      onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                    />
                  </label>
                ))}
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-[#26344d]">Teléfono (10 dígitos)</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "") }))
                    }
                  />
                </label>
                <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                  <ImageUploadField
                    label="Logo"
                    folder="establishments"
                    value={form.profile_image_url}
                    heightClass="h-36"
                    onChange={(url) => setForm((current) => ({ ...current, profile_image_url: url }))}
                  />
                  <ImageUploadField
                    label="Banner"
                    folder="establishments"
                    value={form.banner_image_url}
                    heightClass="h-36"
                    onChange={(url) => setForm((current) => ({ ...current, banner_image_url: url }))}
                  />
                </div>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#26344d]">Descripción</span>
                  <textarea
                    required
                    rows={4}
                    className={`${inputClass} h-auto py-3`}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-60"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar a revisión"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
