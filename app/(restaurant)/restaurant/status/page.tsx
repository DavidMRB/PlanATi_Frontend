"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  History,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Tag,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import LogoutButton from "@/components/common/LogoutButton";
import LocationPicker from "@/components/map/LocationPicker.tsx";
import {
  locationFromProfile,
  locationPayload,
  validateLocation,
  type LocationValue,
} from "@/components/map/LocationPicker.ts";
import NotificationsBell from "@/components/common/NotificationsBell";
import BrandMark from "@/components/ui/BrandMark";
import { ApiError } from "@/lib/auth-api";
import {
  getRestaurantProfile,
  getRestaurantStatus,
  reapplyRestaurant,
  type RestaurantProfile,
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

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";
const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

const formatDate = (value: string | undefined) =>
  value
    ? new Date(value).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : "";

function formFromProfile(profile: RestaurantProfile): ReapplyForm {
  return {
    name: profile.name,
    category: profile.category,
    address: profile.address,
    phone: (profile.phone ?? "").replace(/\D/g, "").slice(-10),
    contact_email: profile.contact_email ?? "",
    manager_name: profile.manager_name ?? "",
    description: profile.description,
    profile_image_url: profile.profile_image_url,
    banner_image_url: profile.banner_image_url,
  };
}

type Step = {
  title: string;
  description: string;
  label: string;
  state: "done" | "current" | "pending";
  note?: string;
};

export default function RestaurantStatusPage() {
  const [restaurant, setRestaurant] = useState<RestaurantStatus | null>(null);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [form, setForm] = useState<ReapplyForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRestaurantStatus(), getRestaurantProfile().catch(() => null)])
      .then(([status, loadedProfile]) => {
        if (cancelled) return;
        setRestaurant(status ?? null);
        setProfile(loadedProfile ?? null);
        // La corrección parte de los datos actuales del establecimiento.
        if (loadedProfile) {
          setForm(formFromProfile(loadedProfile));
          setLocation(locationFromProfile(loadedProfile));
        }
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

  const handleReapply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLocationTouched(true);
    // La re-aplicación también exige la ubicación (las solicitudes antiguas pueden no tenerla).
    const locationError = validateLocation(location);
    if (locationError) {
      setError(locationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: RestaurantProfileUpdate = {
        ...form,
        phone: form.phone ? `+57${form.phone}` : null,
        ...locationPayload(location),
      };
      const response = await reapplyRestaurant(payload);
      setMessage(response?.message ?? "Tu solicitud fue enviada a revisión.");
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
  const registeredOn = formatDate(profile?.created_at);

  const steps: Step[] = [
    {
      title: "1. Registro inicial",
      description: "Datos comerciales básicos de tu establecimiento enviados a PlanATi.",
      label: "Completado",
      state: "done",
      note: registeredOn,
    },
    {
      title: "2. Revisión del equipo",
      description: "El equipo de PlanATi valida la información y las imágenes de tu perfil.",
      label: isRejected ? "Revisado" : "En revisión",
      state: isRejected ? "done" : "current",
      note: isRejected ? undefined : "Normalmente toma menos de 48 horas",
    },
    {
      title: "3. Subsanación",
      description: isRejected
        ? "Corrige los campos indicados y vuelve a enviar tu solicitud."
        : "Solo se requiere si el equipo solicita ajustes a tu solicitud.",
      label: isRejected ? "En corrección" : "Pendiente",
      state: isRejected ? "current" : "pending",
      note: isRejected ? "Acción requerida" : undefined,
    },
    {
      title: "4. Publicación en la app",
      description: "Activación para que los comensales te vean en el mapa interactivo.",
      label: "Pendiente",
      state: "pending",
      note: "Tras la aprobación",
    },
  ];
  const currentStep = steps.findIndex((step) => step.state === "current") + 1;

  const historyItems = [
    ...(isRejected
      ? [
          {
            icon: AlertCircle,
            tone: "bg-[#fde0e3] text-[#d6154a]",
            title: "PlanATi emitió observaciones",
            detail: restaurant?.rejection_reason ?? "Tu solicitud requiere ajustes antes de ser aprobada.",
          },
        ]
      : [
          {
            icon: Clock,
            tone: "bg-[#eef0ff] text-[#514ddd]",
            title: "Solicitud en revisión",
            detail: "El equipo de PlanATi está validando la información de tu establecimiento.",
          },
        ]),
    {
      icon: ShieldCheck,
      tone: "bg-[#c6f7f0] text-[#0b6b5c]",
      title: "Registro recibido",
      detail: registeredOn ? `Tu establecimiento fue registrado el ${registeredOn}.` : "Tu establecimiento fue registrado.",
    },
  ];

  const field = (key: keyof ReapplyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-5 py-6 text-[#17243d] sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <BrandMark />
          {/* Sin barra superior: la campana avisa cuando el administrador aprueba o rechaza la solicitud. */}
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <LogoutButton />
          </div>
        </div>

        {isLoading && <p className="text-sm text-[#6d6e7a]">Consultando el estado de tu solicitud...</p>}
        {!isLoading && !restaurant && error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {!isLoading && restaurant?.status === "SUSPENDED" && (
          <section className={`${card} space-y-5 p-6 sm:p-8`}>
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Lock aria-hidden="true" className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Establecimiento suspendido</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{restaurant.name}</h1>
                <p className="text-sm text-[#43506a]">
                  Un administrador suspendió tu establecimiento: no aparece en el directorio ni en el mapa y tu panel está
                  bloqueado mientras dure la suspensión.
                </p>
              </div>
            </div>
            {restaurant.suspension_reason && (
              <div className="rounded-2xl bg-[#f1f2f6] px-5 py-4 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6d6e7a]">Motivo</p>
                <p className="mt-1 whitespace-pre-line">{restaurant.suspension_reason}</p>
              </div>
            )}
            <p className="text-sm text-[#43506a]">
              Si ya corregiste lo indicado o crees que es un error, escribe a soporte de PlanATi. Te avisaremos aquí cuando se
              reactive.
            </p>
            <button
              type="button"
              onClick={refreshStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-2.5 text-sm font-bold text-[#514ddd] hover:bg-[#e2e5ff]"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Consultar de nuevo
            </button>
          </section>
        )}

        {!isLoading && restaurant && restaurant.status !== "SUSPENDED" && (
          <>
            {/* Cabecera del establecimiento */}
            <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
              <div aria-hidden="true" className="absolute -right-10 -top-16 size-72 rounded-full bg-[#5df0dc]/20 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef0ff] text-[#9aa0d8]">
                    {profile?.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={profile.profile_image_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                    ) : (
                      <Store aria-hidden="true" className="size-9" />
                    )}
                  </span>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b4a40]">
                        {restaurant.category}
                      </span>
                    </div>
                    <h1 className="text-3xl font-extrabold sm:text-4xl">{restaurant.name}</h1>
                    <p className="flex items-center gap-1.5 text-sm text-[#43506a]">
                      <MapPin aria-hidden="true" className="size-4 shrink-0" />
                      {restaurant.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-stretch gap-3">
                  <div
                    className={`rounded-2xl px-5 py-4 ${isRejected ? "bg-[#fde0e3] text-[#a30f35]" : "bg-[#eef0ff] text-[#26344d]"}`}
                  >
                    <p className="flex items-center gap-2 text-sm font-extrabold uppercase">
                      <span aria-hidden="true" className={`size-2 rounded-full ${isRejected ? "bg-[#d6154a]" : "bg-[#514ddd]"}`} />
                      {isRejected ? "En subsanación" : "En revisión"}
                    </p>
                    <p className="mt-1 max-w-[12rem] text-xs">
                      {isRejected ? "Requiere ajustes en tu solicitud" : "El equipo está validando tu solicitud"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshStatus}
                    className="flex items-center gap-2 rounded-2xl bg-[#f3f5ff] px-5 py-4 text-sm font-bold text-[#514ddd] hover:bg-[#e6eaff]"
                  >
                    <RefreshCw aria-hidden="true" className="size-4" />
                    Actualizar estado
                  </button>
                </div>
              </div>
            </header>

            {message && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                {message}
              </p>
            )}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            {/* Observaciones */}
            {isRejected && (
              <section className="flex flex-col gap-4 rounded-3xl bg-[linear-gradient(135deg,#d6154a,#a30f35)] p-6 text-white shadow-[0_12px_30px_rgba(214,21,74,0.28)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex items-start gap-4">
                  <AlertCircle aria-hidden="true" className="mt-1 size-6 shrink-0" />
                  <div className="space-y-2">
                    <span className="inline-block rounded-md bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                      Observaciones del equipo PlanATi
                    </span>
                    <p className="max-w-2xl text-lg leading-relaxed">
                      “{restaurant.rejection_reason ?? "Tu solicitud requiere ajustes antes de ser aprobada."}”
                    </p>
                  </div>
                </div>
                <a
                  href="#subsanacion"
                  className="shrink-0 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#d6154a] hover:bg-[#fff1f4] sm:self-center"
                >
                  Subsanar ahora ↓
                </a>
              </section>
            )}

            {/* Hoja de ruta */}
            <section className={`${card} space-y-5 p-6 sm:p-8`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">Hoja de ruta de afiliación</h2>
                  <p className="text-sm text-[#43506a]">Sigue los 4 pasos para la habilitación total en la app PlanATi.</p>
                </div>
                <span className="rounded-full bg-[#e6eaff] px-3 py-1 text-xs font-bold text-[#514ddd]">
                  Paso {currentStep} en curso
                </span>
              </div>
              <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className={`space-y-3 rounded-2xl p-5 ${
                      step.state === "current" ? "bg-[#e6eaff] shadow-[0_8px_20px_rgba(81,77,221,0.15)]" : "bg-[#f3f5ff]"
                    } ${step.state === "pending" ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex size-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                          step.state === "done" ? "bg-[#0b6b5c]" : step.state === "current" ? "bg-[#514ddd]" : "bg-[#c9cdf4] text-[#6d6e7a]"
                        }`}
                      >
                        {step.state === "done" ? <Check aria-hidden="true" className="size-4" /> : index + 1}
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#43506a]">{step.label}</span>
                    </div>
                    <h3 className="text-sm font-extrabold">{step.title}</h3>
                    <p className="text-xs text-[#43506a]">{step.description}</p>
                    {step.note && (
                      <p className={`text-xs ${step.state === "current" ? "font-bold text-[#514ddd]" : "text-[#6d6e7a]"}`}>{step.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
              <div className="space-y-6">
                {/* Subsanación */}
                {isRejected ? (
                  <form id="subsanacion" onSubmit={handleReapply} className={`${card} space-y-5 p-6 sm:p-8`} noValidate>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#514ddd]">Subsanación de información</p>
                      <h2 className="text-2xl font-extrabold">Campos requeridos</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {(
                        [
                          ["name", "Nombre del establecimiento"],
                          ["manager_name", "Nombre del gerente"],
                          ["category", "Categoría"],
                          ["address", "Dirección"],
                          ["contact_email", "Correo de contacto"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block space-y-1.5">
                          <span className="text-sm font-semibold text-[#26344d]">{label} *</span>
                          <input required className={inputClass} value={form[key]} onChange={(event) => field(key, event.target.value)} />
                        </label>
                      ))}
                      <label className="block space-y-1.5">
                        <span className="text-sm font-semibold text-[#26344d]">Teléfono de reservas y atención *</span>
                        <div className="flex">
                          <span className="flex h-11 items-center rounded-l-xl bg-[#dfe3f7] px-3 text-sm font-bold">+57</span>
                          <input
                            required
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="312 489 9021"
                            className={`${inputClass} rounded-l-none`}
                            value={form.phone}
                            onChange={(event) => field("phone", event.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                        <span className="text-xs text-[#6d6e7a]">Número móvil colombiano de 10 dígitos.</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#26344d]">Ubicación del establecimiento *</p>
                      <LocationPicker
                        value={location}
                        onChange={(next) => {
                          setLocation(next);
                          setLocationTouched(true);
                        }}
                        address={form.address}
                        onUseAddress={(address) => field("address", address)}
                        previewName={form.name}
                        establishmentType={profile?.establishment_type}
                        error={locationTouched ? validateLocation(location) : null}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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

                    <label className="block space-y-1.5">
                      <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
                        Descripción detallada y experiencia gastronómica *
                        <span className="text-xs font-medium text-[#6d6e7a]">{form.description.length} caracteres</span>
                      </span>
                      <textarea
                        required
                        rows={5}
                        className={`${inputClass} h-auto py-3`}
                        value={form.description}
                        onChange={(event) => field("description", event.target.value)}
                      />
                    </label>

                    <div className="flex flex-col gap-4 border-t border-[#eef0f8] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-xs text-[#6d6e7a]">
                        <Lock aria-hidden="true" className="size-4 text-[#0b6b5c]" />
                        Los cambios serán remitidos al equipo de PlanATi.
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca] disabled:opacity-60"
                      >
                        <Send aria-hidden="true" className="size-4" />
                        {isSubmitting ? "Enviando..." : "Guardar y enviar subsanación"}
                      </button>
                    </div>
                  </form>
                ) : (
                  profile && (
                    <section className={`${card} space-y-4 p-6 sm:p-8`}>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#514ddd]">Resumen de tu solicitud</p>
                        <h2 className="text-2xl font-extrabold">Información enviada</h2>
                      </div>
                      <p className="whitespace-pre-line rounded-2xl bg-[#f3f5ff] p-5 text-base leading-relaxed text-[#26344d]">
                        {profile.description}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-[#6d6e7a]">
                        <Lock aria-hidden="true" className="size-4 text-[#0b6b5c]" />
                        Mientras tu solicitud está en revisión no puedes editar estos datos.
                      </p>
                    </section>
                  )
                )}

                {/* Historial */}
                <section className={`${card} space-y-4 p-6 sm:p-8`}>
                  <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <History aria-hidden="true" className="size-5 text-[#514ddd]" />
                    Historial de interacciones del expediente
                  </h2>
                  <ul className="space-y-3">
                    {historyItems.map(({ icon: Icon, tone, title, detail }) => (
                      <li key={title} className="flex items-start gap-3 rounded-2xl bg-[#f3f5ff] p-4">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">{title}</p>
                          <p className="text-xs text-[#43506a]">{detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="space-y-6">
                {profile && (
                  <section className={`${card} space-y-4 p-6`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#514ddd]">Cuenta responsable</p>
                      <span className="rounded-full bg-[#c6f7f0] px-2.5 py-0.5 text-xs font-bold text-[#0b6b5c]">Titular</span>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold">{profile.manager_name ?? "Sin gerente registrado"}</p>
                      <p className="text-xs text-[#6d6e7a]">Propietario / gerente</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {profile.contact_email && (
                        <li className="flex items-center gap-3 rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <Mail aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
                          <span className="truncate font-semibold">{profile.contact_email}</span>
                        </li>
                      )}
                      {profile.phone && (
                        <li className="flex items-center gap-3 rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <Phone aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
                          <span className="font-semibold">{profile.phone}</span>
                        </li>
                      )}
                    </ul>
                  </section>
                )}

                {profile && (
                  <section className={`${card} space-y-4 overflow-hidden p-6`}>
                    <p className="text-xl font-extrabold">Ficha operativa</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-3 rounded-xl bg-[#f3f5ff] px-4 py-3">
                        <Tag aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
                        <span className="font-semibold">
                          {profile.category}
                          {profile.price_range ? ` • ${profile.price_range}` : ""}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 rounded-xl bg-[#f3f5ff] px-4 py-3">
                        <MapPin aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
                        <span className="font-semibold">{profile.address}</span>
                      </li>
                      {registeredOn && (
                        <li className="rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <p className="text-xs text-[#6d6e7a]">Radicación original</p>
                          <p className="font-semibold">{registeredOn}</p>
                        </li>
                      )}
                    </ul>
                    {profile.banner_image_url && (
                      <div className="relative -mx-6 -mb-6 h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
                        <img src={profile.banner_image_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <p className="absolute bottom-3 left-4 text-xs font-semibold text-white">Portada de tu establecimiento</p>
                      </div>
                    )}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
