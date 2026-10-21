"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import LogoutButton from "@/components/common/LogoutButton";
import PhoneCodeModal from "@/components/common/PhoneCodeModal";
import Navbar from "@/components/common/Navbar";
import BrandMark from "@/components/ui/BrandMark";
import {
  ApiError,
  AUTH_ENDPOINTS,
  authEndpoint,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
  type UserProfile,
} from "@/lib/auth-api";

type ProfileForm = {
  full_name: string;
  nickname: string;
  phone: string;
};

const toPhoneDigits = (phone?: string | null) => (phone ?? "").replace(/\D/g, "").slice(-10);

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

export default function UserProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Número nuevo a la espera del código SMS; mientras tanto la cuenta conserva el anterior.
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile)
      .then((data) => {
        if (cancelled || !data) return;
        setProfile(data);
        setForm({
          full_name: data.full_name,
          nickname: data.nickname ?? "",
          phone: toPhoneDigits(data.phone_number),
        });
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        // Sin sesión vigente el proxy ya redirige; esto cubre una sesión expirada en la navegación.
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tu perfil.");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // La foto se guarda en cuanto termina de subir, sin esperar al botón de guardar.
  const savePicture = async (url: string | null) => {
    setError("");
    setMessage("");
    try {
      const updated = await patchAuthRequest<Partial<UserProfile>, UserProfile>(AUTH_ENDPOINTS.saveProfile, {
        picture: url ?? "",
      });
      if (updated) setProfile(updated);
      setMessage("Foto de perfil actualizada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la foto.");
    }
  };

  const sendPhoneCode = (phone: string) =>
    postAuthRequest(authEndpoint("/users/me/phone/send-code"), { phone_number: `+57${phone}` });

  const confirmPhone = async (code: string) => {
    if (!pendingPhone) return;
    const updated = await postAuthRequest<{ phone_number: string; code: string }, UserProfile>(
      authEndpoint("/users/me/phone/verify"),
      { phone_number: `+57${pendingPhone}`, code },
    );
    if (updated) {
      setProfile(updated);
      setForm((current) => (current ? { ...current, phone: toPhoneDigits(updated.phone_number) } : current));
    }
    setPendingPhone(null);
    setError("");
    setMessage("Teléfono verificado y actualizado.");
  };

  // Sin verificar no hay cambio: el campo vuelve al número que ya tenía la cuenta.
  const cancelPhoneChange = () => {
    setPendingPhone(null);
    setForm((current) => (current ? { ...current, phone: toPhoneDigits(profile?.phone_number) } : current));
    setMessage("Se conservó tu número anterior.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setError("");
    setMessage("");

    if (form.full_name.trim().length < 2) {
      setError("Ingresa tu nombre completo (mínimo 2 caracteres).");
      return;
    }
    if (form.phone && !/^3[0-9]{9}$/.test(form.phone)) {
      setError("El teléfono debe ser un celular colombiano de 10 dígitos que empiece por 3.");
      return;
    }

    setIsSaving(true);
    try {
      // El teléfono no viaja aquí: cambiarlo exige verificar el nuevo número por SMS (ver más abajo).
      const updated = await patchAuthRequest<Partial<UserProfile>, UserProfile>(AUTH_ENDPOINTS.saveProfile, {
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim() || null,
      });
      if (updated) setProfile(updated);

      const phoneChanged = form.phone !== "" && form.phone !== toPhoneDigits(profile?.phone_number);
      if (phoneChanged) {
        try {
          await sendPhoneCode(form.phone);
        } catch (sendError) {
          // Sin código no hay cambio de teléfono: el campo vuelve al número vigente.
          setForm((current) => (current ? { ...current, phone: toPhoneDigits(profile?.phone_number) } : current));
          throw sendError;
        }
        setPendingPhone(form.phone);
        setMessage("Tus datos se guardaron. Falta verificar tu nuevo teléfono con el código SMS.");
      } else {
        setMessage("Tus datos se guardaron correctamente.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar tus datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl space-y-8 px-5 py-8 text-[#17243d]">
        <div className="flex items-center justify-between">
          <BrandMark compact />
          <Link href="/explore" className="text-sm font-semibold text-[#4c4cdd] hover:underline">
            Ir al directorio
          </Link>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Mi perfil</h1>
          <p className="text-sm text-[#6d6e7a]">{profile?.email ?? "Revisa y actualiza tus datos personales."}</p>
        </header>

        {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {!form && !error && <p className="text-sm text-[#6d6e7a]">Cargando tu perfil...</p>}

        {form && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0]" noValidate>
            <ImageUploadField
              label="Foto de perfil"
              folder="avatars"
              circle
              value={profile?.picture ?? null}
              onChange={(url) => void savePicture(url)}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[#26344d]">Nombre completo</span>
              <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[#26344d]">Apodo</span>
              <input className={inputClass} value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[#26344d]">Teléfono (10 dígitos)</span>
              <input
                inputMode="numeric"
                maxLength={10}
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#514ddd] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca] disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
              <LogoutButton />
            </div>
          </form>
        )}
      </main>

      {pendingPhone && (
        <PhoneCodeModal
          phone={pendingPhone}
          onVerify={confirmPhone}
          onResend={async () => {
            await sendPhoneCode(pendingPhone);
          }}
          onCancel={cancelPhoneChange}
        />
      )}
    </>
  );
}
