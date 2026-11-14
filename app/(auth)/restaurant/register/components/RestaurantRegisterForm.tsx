"use client";

import { ArrowRight, Check, Eye, EyeOff, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import EstablishmentTypePicker from "@/components/establishment-management/EstablishmentTypePicker";
import LocationPicker from "@/components/map/LocationPicker.tsx";
import ConsentCheckboxes, { EMPTY_CONSENT, consentsAccepted, type ConsentValue } from "@/components/privacy/ConsentCheckboxes";
import { consentPayload } from "@/lib/legal";
import { CONSENT_OUTDATED_MESSAGE, isConsentVersionOutdated } from "@/lib/privacy-api";
import { locationPayload, validateLocation, type LocationValue } from "@/components/map/LocationPicker.ts";
import BrandMark from "@/components/ui/BrandMark";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError } from "@/lib/auth-api";
import { ESTABLISHMENT_CATEGORIES, type EstablishmentType } from "@/lib/establishments-api";
import {
  registerRestaurant,
  updateRestaurantProfile,
  type RestaurantRegisterPayload,
} from "@/lib/restaurant-api";
import { IMAGE_ACCEPT, uploadImage, validateImageFile } from "@/lib/uploads";

type FormValues = {
  accountEmail: string;
  password: string;
  managerName: string;
  establishmentName: string;
  category: string;
  address: string;
  establishmentPhone: string;
  contactEmail: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  accountEmail: "",
  password: "",
  managerName: "",
  establishmentName: "",
  category: "",
  address: "",
  establishmentPhone: "",
  contactEmail: "",
  description: "",
};

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres", test: (value: string) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Un número", test: (value: string) => /[0-9]/.test(value) },
  { label: "Un símbolo especial", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function lengthError(value: string, min: number, max: number, label: string) {
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} debe tener entre ${min} y ${max} caracteres.`;
  }
  return undefined;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!EMAIL_PATTERN.test(values.accountEmail.trim())) {
    errors.accountEmail = "Ingresa un correo de cuenta válido.";
  }
  if (!PASSWORD_RULES.every((rule) => rule.test(values.password))) {
    errors.password = "La contraseña no cumple todos los requisitos.";
  }
  errors.managerName = lengthError(values.managerName, 2, 120, "El nombre del gerente");
  errors.establishmentName = lengthError(values.establishmentName, 2, 150, "El nombre del establecimiento");
  errors.category = lengthError(values.category, 2, 80, "La categoría");
  errors.address = lengthError(values.address, 2, 255, "La dirección");
  if (!PHONE_PATTERN.test(values.establishmentPhone.replace(/\s/g, ""))) {
    errors.establishmentPhone = "Ingresa un teléfono colombiano de 10 dígitos.";
  }
  if (!EMAIL_PATTERN.test(values.contactEmail.trim())) {
    errors.contactEmail = "Ingresa un correo de contacto válido.";
  }
  if (!values.description.trim()) {
    errors.description = "Describe brevemente tu establecimiento.";
  }

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FormErrors;
}

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition placeholder:text-[#8e92a3] focus:ring-[#6868e8]/40";

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-semibold text-[#26344d]">{label}</span>
      {children}
      {error && <span className="block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

// Selector de imagen con vista previa local. No sube nada: el archivo se envía
// después del alta, cuando la cookie de sesión ya existe.
function ImagePicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    const validationError = validateImageFile(selected);
    setError(validationError ?? "");
    if (!validationError) onChange(selected);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-[#26344d]">{label}</span>
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#c9cdf4] bg-[#eef2ff]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: local
          <img src={previewUrl} alt={label} className="size-full object-cover" />
        ) : (
          <ImagePlus aria-hidden="true" className="size-8 text-[#81869a]" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#4c4cdd] shadow-sm ring-1 ring-[#c9cdf4] hover:bg-[#f8f8ff]">
          {file ? "Cambiar imagen" : "Seleccionar imagen"}
          <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={handleChange} />
        </label>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs font-semibold text-[#6d6e7a] hover:text-red-600"
          >
            <X aria-hidden="true" className="size-3.5" />
            Quitar
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default function RestaurantRegisterForm() {
  const router = useRouter();
  const { refresh: refreshSession } = useAuth();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Ubicación obligatoria (decisión D3): sin ella el local no aparece en el mapa ni en cercanos.
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);
  const [establishmentType, setEstablishmentType] = useState<EstablishmentType>("RESTAURANT");
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [consentTouched, setConsentTouched] = useState(false);

  const errors = validate(values);
  const locationError = validateLocation(location);
  const showError = (field: keyof FormValues) => (touched[field] ? errors[field] : undefined);

  const update = (field: keyof FormValues) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };
  const touch = (field: keyof FormValues) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  // Un fallo aquí no deshace el alta: la cuenta ya existe y las imágenes se pueden
  // volver a subir después. Por eso se avisa y se sigue hacia el estado de la solicitud.
  const saveRegistrationImages = async () => {
    if (!logoFile && !bannerFile) return;
    try {
      const [profileImageUrl, bannerImageUrl] = await Promise.all([
        logoFile ? uploadImage("establishments", logoFile) : undefined,
        bannerFile ? uploadImage("establishments", bannerFile) : undefined,
      ]);
      await updateRestaurantProfile({
        profile_image_url: profileImageUrl,
        banner_image_url: bannerImageUrl,
      });
    } catch (imageError) {
      window.alert(
        `Tu solicitud fue enviada, pero no se pudieron guardar las imágenes: ${
          imageError instanceof Error ? imageError.message : "error desconocido"
        }. Podrás subirlas cuando tu establecimiento sea aprobado.`,
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setTouched(Object.fromEntries(Object.keys(EMPTY_VALUES).map((key) => [key, true])));
    setLocationTouched(true);
    setConsentTouched(true);

    if (Object.keys(errors).length > 0 || locationError || !location || !consentsAccepted(consent)) {
      return;
    }

    const payload: RestaurantRegisterPayload = {
      account_email: values.accountEmail.trim(),
      password: values.password,
      manager_name: values.managerName.trim(),
      establishment_name: values.establishmentName.trim(),
      category: values.category.trim(),
      address: values.address.trim(),
      establishment_phone: `+57${values.establishmentPhone.replace(/\s/g, "")}`,
      contact_email: values.contactEmail.trim(),
      description: values.description.trim(),
      establishment_type: establishmentType,
      ...consentPayload(),
      ...locationPayload(location),
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setIsSubmitting(true);
    try {
      // El alta devuelve la cookie de sesión, así que las imágenes se suben ahora.
      await registerRestaurant(payload);
      await saveRegistrationImages();
      // Sesión cargada en AuthProvider antes de navegar (el layout del restaurante redirige a /login con user === null).
      await refreshSession();
      router.push("/restaurant/status");
    } catch (error) {
      if (isConsentVersionOutdated(error)) {
        setSubmitError(CONSENT_OUTDATED_MESSAGE);
      } else if (error instanceof ApiError && error.status === 409) {
        setSubmitError("Este correo de cuenta ya se encuentra registrado.");
      } else {
        setSubmitError(error instanceof Error ? error.message : "No fue posible enviar la solicitud.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] px-5 py-10 text-[#17243d]">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(38,47,99,0.12)] sm:p-10">
        <div className="flex items-center justify-between pb-6">
          <BrandMark />
          <Link href="/login" className="text-xs font-semibold text-[#4c4cdd] hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>

        <header className="space-y-2 pb-6">
          <h1 className="text-2xl font-bold">Registra tu establecimiento</h1>
          <p className="text-sm text-[#6d6e7a]">
            Restaurantes, cafés, bares, hoteles, experiencias o tiendas: tu solicitud será revisada por un
            administrador antes de publicar tu establecimiento. Puedes
            añadir el logo y la portada ahora; las fotos del lugar y del menú las gestionarás desde tu panel
            una vez aprobado.
          </p>
        </header>

        <form className="space-y-8" onSubmit={handleSubmit} noValidate>
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9295a4]">
              Datos de la cuenta
            </legend>
            <Field label="Correo de la cuenta" error={showError("accountEmail")}>
              <input
                type="email"
                className={inputClass}
                value={values.accountEmail}
                onChange={update("accountEmail")}
                onBlur={touch("accountEmail")}
                placeholder="cuenta@ejemplo.com"
              />
            </Field>
            <Field label="Nombre del gerente" error={showError("managerName")}>
              <input
                className={inputClass}
                value={values.managerName}
                onChange={update("managerName")}
                onBlur={touch("managerName")}
              />
            </Field>
            <Field label="Contraseña" className="sm:col-span-2">
              <span className="flex h-11 items-center gap-2 rounded-xl bg-[#eef2ff] px-4 ring-2 ring-transparent focus-within:ring-[#6868e8]/40">
                <input
                  type={showPassword ? "text" : "password"}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={values.password}
                  onChange={update("password")}
                  onBlur={touch("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="text-[#81869a] hover:text-[#4c4cdd]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(values.password);
                  const failed = touched.password && !met;
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-1.5 ${met ? "text-emerald-600" : failed ? "text-red-600" : "text-[#858895]"}`}
                    >
                      {met ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </Field>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9295a4]">
              Datos del establecimiento
            </legend>
            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-[#26344d]">Tipo de establecimiento</span>
              <EstablishmentTypePicker value={establishmentType} onChange={setEstablishmentType} />
            </div>
            <Field label="Nombre del establecimiento" error={showError("establishmentName")}>
              <input
                className={inputClass}
                value={values.establishmentName}
                onChange={update("establishmentName")}
                onBlur={touch("establishmentName")}
              />
            </Field>
            <Field label="Categoría" error={showError("category")}>
              <input
                list="restaurant-categories"
                className={inputClass}
                value={values.category}
                onChange={update("category")}
                onBlur={touch("category")}
                placeholder="Ej. Parrilla, Cafetería, Hostal"
              />
              <datalist id="restaurant-categories">
                {ESTABLISHMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>
            <Field label="Dirección" className="sm:col-span-2" error={showError("address")}>
              <input
                className={inputClass}
                value={values.address}
                onChange={update("address")}
                onBlur={touch("address")}
              />
            </Field>
            <Field label="Teléfono del establecimiento" error={showError("establishmentPhone")}>
              <span className="flex h-11 items-center gap-2 rounded-xl bg-[#eef2ff] px-4 ring-2 ring-transparent focus-within:ring-[#6868e8]/40">
                <span className="text-sm font-semibold text-[#6d6e7a]">+57</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={values.establishmentPhone}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      establishmentPhone: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  onBlur={touch("establishmentPhone")}
                />
              </span>
            </Field>
            <Field label="Correo de contacto" error={showError("contactEmail")}>
              <input
                type="email"
                className={inputClass}
                value={values.contactEmail}
                onChange={update("contactEmail")}
                onBlur={touch("contactEmail")}
              />
            </Field>
            <Field label="Descripción" className="sm:col-span-2" error={showError("description")}>
              <textarea
                rows={4}
                className={`${inputClass} h-auto py-3`}
                value={values.description}
                onChange={update("description")}
                onBlur={touch("description")}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9295a4]">
              Ubicación del establecimiento
            </legend>
            <p className="text-sm text-[#6d6e7a]">
              Marca el punto exacto de tu local: así aparecerá en el mapa y en las búsquedas de lugares cercanos.
            </p>
            <LocationPicker
              value={location}
              onChange={(next) => {
                setLocation(next);
                setLocationTouched(true);
              }}
              address={values.address}
              onUseAddress={(address) => {
                setValues((current) => ({ ...current, address }));
                setTouched((current) => ({ ...current, address: true }));
              }}
              previewName={values.establishmentName.trim()}
              error={locationTouched ? locationError : null}
            />
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9295a4]">
              Imágenes (opcional)
            </legend>
            <ImagePicker label="Logo" file={logoFile} onChange={setLogoFile} />
            <ImagePicker label="Portada" file={bannerFile} onChange={setBannerFile} />
          </fieldset>

          <ConsentCheckboxes value={consent} onChange={setConsent} showError={consentTouched} />

          {submitError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] text-base font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] disabled:opacity-60"
          >
            {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </form>
      </section>
    </main>
  );
}
