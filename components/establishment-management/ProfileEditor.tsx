"use client";

import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Smartphone,
  Store,
  Trash2,
  User,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ESTABLISHMENT_STATUS_CLASS, ESTABLISHMENT_STATUS_LABEL } from "@/lib/format";
import { IMAGE_ACCEPT, uploadImage, validateImageFile } from "@/lib/uploads";
import LocationPicker from "@/components/map/LocationPicker.tsx";
import {
  locationFromProfile,
  locationPayload,
  validateLocation,
  type LocationValue,
} from "@/components/map/LocationPicker.ts";
import { isEstablishmentType, type EstablishmentType } from "@/lib/establishments-api";
import type { RestaurantProfile, RestaurantProfileUpdate } from "@/lib/restaurant-api";
import EstablishmentTypePicker from "./EstablishmentTypePicker";
import type { EstablishmentManagementApi } from "@/lib/management-api";

type ProfileForm = {
  name: string;
  category: string;
  address: string;
  phone: string;
  contact_email: string;
  manager_name: string;
  description: string;
  price_range: string;
  establishment_type: EstablishmentType;
};

const inputClass =
  "h-12 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";
const cardClass = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8";
const labelClass = "text-sm font-bold text-[#26344d]";

const PRICE_OPTIONS = [
  { value: "$", label: "Económico", hint: "< $30.000 COP" },
  { value: "$$", label: "Moderado", hint: "$30k - $65k COP" },
  { value: "$$$", label: "Exclusivo", hint: "$65k - $120k COP" },
  { value: "$$$$", label: "Alta cocina", hint: "> $120.000 COP" },
];

const COMPLETENESS_FIELDS: Array<keyof ProfileForm> = ["name", "category", "address", "phone", "contact_email", "manager_name", "description", "price_range"];

function toForm(profile: RestaurantProfile): ProfileForm {
  return {
    name: profile.name,
    category: profile.category,
    address: profile.address,
    phone: (profile.phone ?? "").replace(/\D/g, "").slice(-10),
    contact_email: profile.contact_email ?? "",
    manager_name: profile.manager_name ?? "",
    description: profile.description,
    price_range: profile.price_range ?? "",
    // Un tipo que el frontend no conozca se muestra como "Otro", pero solo se envía si se cambia.
    establishment_type: isEstablishmentType(profile.establishment_type) ? profile.establishment_type : "OTHER",
  };
}

export default function ProfileEditor({ api }: { api: EstablishmentManagementApi }) {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<"profile_image_url" | "banner_image_url" | null>(null);
  const [location, setLocation] = useState<LocationValue | null>(null);

  useEffect(() => {
    api.getProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm(toForm(data));
          setLocation(locationFromProfile(data));
        }
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tu perfil.");
      });
  }, [api]);

  // Las imágenes se guardan en cuanto terminan de subir, sin esperar al botón de guardar.
  const saveImage = async (field: "profile_image_url" | "banner_image_url", url: string | null) => {
    setError("");
    setMessage("");
    try {
      const updated = await api.updateProfile({ [field]: url });
      if (updated) setProfile(updated);
      setMessage("Imagen actualizada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la imagen.");
    }
  };

  const pickImage = (field: "profile_image_url" | "banner_image_url") => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(field);
    try {
      const publicUrl = await uploadImage("establishments", file, undefined, api.createUploadUrl);
      await saveImage(field, publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible subir la imagen.");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    // Una vez fijada, la ubicación no se puede quitar: solo cambiar de punto.
    const locationError = validateLocation(location, false);
    if (locationError) {
      setError(locationError);
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    const payload: RestaurantProfileUpdate = {
      name: form.name.trim(),
      category: form.category.trim(),
      address: form.address.trim(),
      phone: form.phone ? `+57${form.phone}` : null,
      contact_email: form.contact_email.trim(),
      manager_name: form.manager_name.trim(),
      description: form.description.trim(),
      price_range: form.price_range.trim() || null,
      ...(form.establishment_type !== profile?.establishment_type ? { establishment_type: form.establishment_type } : {}),
      ...locationPayload(location),
    };

    try {
      const updated = await api.updateProfile(payload);
      if (updated) {
        setProfile(updated);
        setForm(toForm(updated));
        setLocation(locationFromProfile(updated));
      }
      setMessage("Cambios guardados.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!form || !profile) {
    return <p className="text-sm text-[#6d6e7a]">{error || "Cargando perfil..."}</p>;
  }

  const update = (field: keyof ProfileForm) => (value: string) =>
    setForm((current) => (current ? { ...current, [field]: value } : current));

  const filled = COMPLETENESS_FIELDS.filter((field) => form[field].trim() !== "").length;
  const imagesFilled = [profile.banner_image_url, profile.profile_image_url].filter(Boolean).length;
  const completeness = Math.round(((filled + imagesFilled) / (COMPLETENESS_FIELDS.length + 2)) * 100);

  const discard = () => {
    setForm(toForm(profile));
    setLocation(locationFromProfile(profile));
    setError("");
    setMessage("");
  };

  const adminMode = api.mode === "admin";
  const Heading = adminMode ? "h2" : "h1";

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <header className={`flex flex-col gap-5 ${adminMode ? "" : "lg:flex-row lg:items-end lg:justify-between"}`}>
        <div className="space-y-2">
          {api.mode === "restaurant" && (
            <nav aria-label="Ruta" className="flex items-center gap-2 text-xs text-[#6d6e7a]">
              <Link href="/restaurant/dashboard" className="hover:underline">Portal de aliados</Link>
              <span aria-hidden="true">›</span>
              <span className="font-semibold text-[#17243d]">Perfil del establecimiento</span>
            </nav>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-[#0b6b5c]">Identidad comercial pública</p>
          <div className="flex flex-wrap items-center gap-3">
            <Heading className={adminMode ? "text-xl font-extrabold sm:text-2xl" : "text-3xl font-extrabold sm:text-4xl"}>Perfil del establecimiento</Heading>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTABLISHMENT_STATUS_CLASS[profile.status]}`}>{ESTABLISHMENT_STATUS_LABEL[profile.status]}</span>
          </div>
          <p className="max-w-2xl text-base text-[#6d6e7a]">Así verán tu establecimiento los clientes en el directorio.</p>
        </div>
        <div className="hidden shrink-0 gap-3 lg:flex">
          <button
            type="button"
            onClick={discard}
            className="flex items-center gap-2 rounded-xl bg-[#eef0ff] px-5 py-3 text-sm font-bold text-[#26344d] hover:bg-[#e2e5ff]"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Descartar cambios
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#514ddd] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca] disabled:opacity-60"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </header>

      {message && <p className="rounded-2xl bg-[#c6f7f0] px-5 py-4 text-sm font-semibold text-[#0b6b5c]">{message}</p>}
      {error && <p className="rounded-2xl bg-[#fde8ea] px-5 py-4 text-sm font-semibold text-[#a30f35]">{error}</p>}

      <div className={`grid gap-6 ${adminMode ? "min-w-0" : "lg:grid-cols-[minmax(0,1fr)_21rem]"}`}>
        <div className="space-y-6">
          <section className={`${cardClass} space-y-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Gestión visual de marca</h2>
              <span className="hidden rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#26344d] sm:inline">Formatos WEBP, JPG, PNG</span>
            </div>

            <div className="relative h-56 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#3f3bb5,#6d69ea_55%,#5df0dc)] sm:h-72">
              {profile.banner_image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                <img src={profile.banner_image_url} alt="Portada" className="size-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
              <span className="absolute left-4 top-4 flex max-w-[55%] items-center gap-2 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                <ImagePlus aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">Portada recomendada: 1920 × 600 px</span>
              </span>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-[#17243d] shadow hover:bg-white">
                  {uploading === "banner_image_url" ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Camera aria-hidden="true" className="size-4 text-[#514ddd]" />
                  )}
                  Cambiar portada
                  <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={pickImage("banner_image_url")} />
                </label>
                {profile.banner_image_url && (
                  <button
                    type="button"
                    aria-label="Quitar portada"
                    onClick={() => void saveImage("banner_image_url", null)}
                    className="flex size-9 items-center justify-center rounded-xl bg-white/95 text-[#d6154a] shadow hover:bg-white"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="-mt-16 flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:px-6">
              <div className="relative size-28 shrink-0 sm:size-32">
                <span className="flex size-full items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#eef0ff] text-[#514ddd] shadow-[0_8px_24px_rgba(23,36,61,0.18)]">
                  {profile.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={profile.profile_image_url} alt="Logo" className="size-full object-cover" />
                  ) : (
                    <Store aria-hidden="true" className="size-10" />
                  )}
                </span>
                {profile.status === "APPROVED" && (
                  <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#514ddd] text-white ring-2 ring-white">
                    <BadgeCheck aria-hidden="true" className="size-4" />
                  </span>
                )}
              </div>
              <div className="space-y-2 pb-1">
                <div>
                  <p className="font-bold">Logo / avatar</p>
                  <p className="text-xs text-[#6d6e7a]">Cuadrado, 500×500 px mínimo</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#eef0ff] px-4 py-2 text-xs font-bold text-[#514ddd] hover:bg-[#e2e5ff]">
                    {uploading === "profile_image_url" ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Camera aria-hidden="true" className="size-4" />
                    )}
                    Cambiar avatar
                    <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={pickImage("profile_image_url")} />
                  </label>
                  {profile.profile_image_url && (
                    <button
                      type="button"
                      aria-label="Quitar logo"
                      onClick={() => void saveImage("profile_image_url", null)}
                      className="flex size-9 items-center justify-center rounded-xl bg-[#fde0e3] text-[#d6154a] hover:bg-[#fbd0d5]"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <form id="profile-form" onSubmit={handleSubmit} className={`${cardClass} space-y-8`} noValidate>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 text-xl font-bold">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                  <Store aria-hidden="true" className="size-5" />
                </span>
                Información comercial
              </h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0b6b5c]">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0b6b5c]" />
                Campos obligatorios (*)
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="flex items-center justify-between">
                  <span className={labelClass}>Nombre comercial *</span>
                  <span className="text-xs text-[#6d6e7a]">{form.name.length} / 150</span>
                </span>
                <span className="relative block">
                  <Store aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input required maxLength={150} className={`${inputClass} pl-11`} value={form.name} onChange={(e) => update("name")(e.target.value)} />
                </span>
              </label>
              <label className="block space-y-2">
                <span className={labelClass}>Categoría principal *</span>
                <span className="relative block">
                  <UtensilsCrossed aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input required className={`${inputClass} pl-11`} value={form.category} onChange={(e) => update("category")(e.target.value)} />
                </span>
                <span className="block text-xs text-[#6d6e7a]">Determina tu posición en los filtros de búsqueda.</span>
              </label>
            </div>

            <div className="space-y-2">
              <p className={labelClass}>Tipo de establecimiento *</p>
              <EstablishmentTypePicker
                value={form.establishment_type}
                onChange={(type) => setForm((current) => (current ? { ...current, establishment_type: type } : current))}
              />
              <p className="text-xs text-[#6d6e7a]">Define en qué filtro de explorar aparece tu lugar y el icono de su marcador en el mapa.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-address" className={`${labelClass} block`}>
                Dirección física del establecimiento *
              </label>
              <div>
                <span className="relative block">
                  <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input
                    id="profile-address"
                    required
                    className={`${inputClass} pl-11`}
                    value={form.address}
                    onChange={(e) => update("address")(e.target.value)}
                  />
                </span>
              </div>
              <p className="text-xs text-[#6d6e7a]">Ayuda a los comensales a calcular su ruta en tiempo real.</p>
            </div>

            <div className="space-y-3">
              <p className={labelClass}>Ubicación en el mapa *</p>
              {!location && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Tu establecimiento aún no tiene ubicación: no aparece en el mapa ni en las búsquedas de lugares cercanos.
                </p>
              )}
              <LocationPicker
                value={location}
                onChange={setLocation}
                address={form.address}
                onUseAddress={(address) => update("address")(address)}
                previewName={form.name}
                establishmentType={form.establishment_type}
              />
            </div>

            <label className="block space-y-2">
              <span className="flex items-center justify-between">
                <span className={labelClass}>Descripción para comensales *</span>
                <span className="text-xs text-[#6d6e7a]">{form.description.length} caracteres</span>
              </span>
              <textarea
                rows={5}
                required
                className={`${inputClass} h-auto py-4 leading-relaxed`}
                value={form.description}
                onChange={(e) => update("description")(e.target.value)}
              />
              <span className="block text-xs text-[#6d6e7a]">Sé descriptivo: incluye tipo de cocina, ambiente y si aceptas mascotas o reservas para grupos.</span>
            </label>

            <fieldset className="space-y-3">
              <legend className={labelClass}>Rango de precios promedio por comensal</legend>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {PRICE_OPTIONS.map((option) => {
                  const active = form.price_range === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update("price_range")(active ? "" : option.value)}
                      className={`rounded-2xl p-4 text-left transition ${
                        active
                          ? "bg-[#e0e3ff] shadow-[0_8px_18px_rgba(81,77,221,0.18)] ring-2 ring-[#514ddd]"
                          : "bg-[#eef2ff] hover:bg-[#e4e8ff]"
                      }`}
                    >
                      <span className="flex items-center justify-between text-2xl font-extrabold">
                        <span className={active ? "text-[#514ddd]" : ""}>{option.value}</span>
                        {active && <CheckCircle2 aria-hidden="true" className="size-5 text-[#514ddd]" />}
                      </span>
                      <span className="mt-3 block text-sm font-bold">{option.label}</span>
                      <span className="block text-xs text-[#6d6e7a]">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className={labelClass}>Teléfono de contacto (10 dígitos)</span>
                <span className="relative block">
                  <Phone aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    className={`${inputClass} pl-11`}
                    value={form.phone}
                    onChange={(e) => update("phone")(e.target.value.replace(/\D/g, ""))}
                  />
                </span>
                <span className="block text-xs text-[#6d6e7a]">Se guarda con el prefijo +57.</span>
              </label>
              <label className="block space-y-2">
                <span className={labelClass}>Correo de contacto</span>
                <span className="relative block">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input type="email" className={`${inputClass} pl-11`} value={form.contact_email} onChange={(e) => update("contact_email")(e.target.value)} />
                </span>
                <span className="block text-xs text-[#6d6e7a]">Visible para los clientes en tu perfil público.</span>
              </label>
              <label className="block space-y-2">
                <span className={labelClass}>Nombre del gerente</span>
                <span className="relative block">
                  <User aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6d6e7a]" />
                  <input className={`${inputClass} pl-11`} value={form.manager_name} onChange={(e) => update("manager_name")(e.target.value)} />
                </span>
              </label>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <section className={`${cardClass} space-y-4 !p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Smartphone aria-hidden="true" className="size-5 text-[#0b6b5c]" />
                Vista previa en app
              </h2>
              <span className="rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b6b5c]">En vivo</span>
            </div>
            <p className="text-sm text-[#6d6e7a]">Así visualizan los usuarios tu establecimiento en la tarjeta de descubrimiento.</p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.12)]">
              <div className="relative h-40 bg-[linear-gradient(135deg,#eef2ff,#e8fbfa)]">
                {profile.banner_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                  <img src={profile.banner_image_url} alt="" className="size-full object-cover" />
                )}
                {form.price_range && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold">{form.price_range}</span>
                )}
                <span className="absolute -bottom-6 left-4 flex size-14 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-[#eef0ff] text-[#514ddd]">
                  {profile.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img src={profile.profile_image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <Store aria-hidden="true" className="size-6" />
                  )}
                </span>
              </div>
              <div className="space-y-1 p-4 pt-8">
                <p className="text-lg font-bold">{form.name || "Nombre del establecimiento"}</p>
                <p className="text-xs font-semibold text-[#0b6b5c]">{form.category || "Categoría"}</p>
                <p className="line-clamp-2 text-sm text-[#6d6e7a]">{form.description || "Descripción del lugar"}</p>
                <p className="flex items-center gap-1.5 pt-1 text-xs text-[#6d6e7a]">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0">{form.address || "Dirección"}</span>
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-3xl bg-[#eef0ff] p-6">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Completitud del perfil</span>
              <span className="text-[#514ddd]">{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[#514ddd] transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <p className="text-xs text-[#6d6e7a]">Completa los datos, el logo y la portada para destacar en el directorio.</p>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mt-4 rounded-xl border border-[#e4e6f0] bg-white/95 p-2 backdrop-blur md:bottom-3 lg:hidden">
        <button
          type="submit"
          form="profile-form"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-5 py-3.5 text-base font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca] disabled:opacity-60"
        >
          <Save aria-hidden="true" className="size-4" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
