"use client";

import { useEffect, useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  type RestaurantProfile,
  type RestaurantProfileUpdate,
} from "@/lib/restaurant-api";

type ProfileForm = {
  name: string;
  category: string;
  address: string;
  phone: string;
  contact_email: string;
  manager_name: string;
  description: string;
  price_range: string;
  latitude: string;
  longitude: string;
};

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

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
    latitude: profile.latitude ?? "",
    longitude: profile.longitude ?? "",
  };
}

export default function RestaurantProfilePage() {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getRestaurantProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm(toForm(data));
        }
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tu perfil.");
      });
  }, []);

  // Las imágenes se guardan en cuanto terminan de subir, sin esperar al botón de guardar.
  const saveImage = async (field: "profile_image_url" | "banner_image_url", url: string | null) => {
    setError("");
    setMessage("");
    try {
      const updated = await updateRestaurantProfile({ [field]: url });
      if (updated) setProfile(updated);
      setMessage("Imagen actualizada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la imagen.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

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
      latitude: form.latitude.trim() || null,
      longitude: form.longitude.trim() || null,
    };

    try {
      const updated = await updateRestaurantProfile(payload);
      if (updated) {
        setProfile(updated);
        setForm(toForm(updated));
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Perfil del restaurante</h1>
        <p className="text-sm text-[#6d6e7a]">Así verán tu establecimiento los clientes en el directorio.</p>
      </header>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <section className="grid gap-6 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0] md:grid-cols-2">
        <ImageUploadField
          label="Portada"
          folder="establishments"
          value={profile.banner_image_url}
          heightClass="h-44"
          onChange={(url) => void saveImage("banner_image_url", url)}
        />
        <ImageUploadField
          label="Logo"
          folder="establishments"
          value={profile.profile_image_url}
          heightClass="h-44"
          onChange={(url) => void saveImage("profile_image_url", url)}
        />
      </section>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0] sm:grid-cols-2" noValidate>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Nombre del establecimiento</span>
          <input required className={inputClass} value={form.name} onChange={(e) => update("name")(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Categoría</span>
          <input required className={inputClass} value={form.category} onChange={(e) => update("category")(e.target.value)} />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-[#26344d]">Dirección</span>
          <input required className={inputClass} value={form.address} onChange={(e) => update("address")(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Teléfono (10 dígitos)</span>
          <input
            inputMode="numeric"
            maxLength={10}
            className={inputClass}
            value={form.phone}
            onChange={(e) => update("phone")(e.target.value.replace(/\D/g, ""))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Correo de contacto</span>
          <input type="email" className={inputClass} value={form.contact_email} onChange={(e) => update("contact_email")(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Nombre del gerente</span>
          <input className={inputClass} value={form.manager_name} onChange={(e) => update("manager_name")(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Rango de precios</span>
          <input className={inputClass} placeholder="Ej. $$" value={form.price_range} onChange={(e) => update("price_range")(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#26344d]">Latitud</span>
            <input inputMode="decimal" className={inputClass} value={form.latitude} onChange={(e) => update("latitude")(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#26344d]">Longitud</span>
            <input inputMode="decimal" className={inputClass} value={form.longitude} onChange={(e) => update("longitude")(e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-[#26344d]">Descripción</span>
          <textarea
            rows={4}
            required
            className={`${inputClass} h-auto py-3`}
            value={form.description}
            onChange={(e) => update("description")(e.target.value)}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#514ddd] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca] disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
