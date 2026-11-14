"use client";

import {
  MessageSquare,
  AtSign,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  IdCard,
  Loader2,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import LogoutButton from "@/components/common/LogoutButton";
import MyReviewsList from "@/components/reviews/MyReviewsList";
import PrivacySettings from "@/components/privacy/PrivacySettings";
import PhoneCodePanel from "@/components/common/PhoneCodePanel";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ApiError,
  AUTH_ENDPOINTS,
  authEndpoint,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
  type UserProfile,
} from "@/lib/auth-api";
import { IMAGE_ACCEPT, uploadImage, validateImageFile } from "@/lib/uploads";

type ProfileForm = {
  full_name: string;
  nickname: string;
  phone: string;
};

const toPhoneDigits = (phone?: string | null) => (phone ?? "").replace(/\D/g, "").slice(-10);

const card = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8";
const fieldShell =
  "flex h-14 items-center gap-3 rounded-2xl bg-[#eef2ff] px-4 text-[#17243d] ring-2 ring-transparent transition focus-within:ring-[#6868e8]/40";

export default function UserProfilePage() {
  const router = useRouter();
  const { refresh: refreshSession } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [initialForm, setInitialForm] = useState<ProfileForm | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  // Número nuevo a la espera del código SMS; mientras tanto la cuenta conserva el anterior.
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile)
      .then((data) => {
        if (cancelled || !data) return;
        const loaded = {
          full_name: data.full_name,
          nickname: data.nickname ?? "",
          phone: toPhoneDigits(data.phone_number),
        };
        setProfile(data);
        setForm(loaded);
        setInitialForm(loaded);
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
      void refreshSession();
      setMessage(url ? "Foto de perfil actualizada." : "Foto de perfil eliminada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la foto.");
    }
  };

  const handlePictureChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMessage("");
    setIsUploadingPicture(true);
    try {
      await savePicture(await uploadImage("avatars", file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible subir la foto.");
    } finally {
      setIsUploadingPicture(false);
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

  const discardChanges = () => {
    if (initialForm) setForm({ ...initialForm, phone: toPhoneDigits(profile?.phone_number) });
    setPendingPhone(null);
    setError("");
    setMessage("");
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
      void refreshSession();

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

  const displayName = profile?.full_name ?? "";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
    : null;
  const phoneVerified = profile?.phone_verified ?? false;

  return (
    <>
      <main className="min-h-screen bg-[#f8f9ff] text-[#17243d]">
        <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">
          <header className="space-y-3">
            <span className="inline-block rounded-full bg-[#e6eaff] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#514ddd]">
              Configuración de cuenta
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Mi Perfil</h1>
            <p className="max-w-2xl text-base text-[#43506a]">
              Administra tu información personal, seguridad de cuenta y preferencias en PlanATi.
            </p>
          </header>

          {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {!form && !error && <p className="text-sm text-[#6d6e7a]">Cargando tu perfil...</p>}

          {form && profile && (
            <>
              {/* Resumen */}
              <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#eef0ff,#e3f8f6)] p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <span className="relative flex size-28 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md">
                    {profile.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL de R2 o Google
                      <img src={profile.picture} alt="" referrerPolicy="no-referrer" className="size-full rounded-2xl object-cover" />
                    ) : (
                      <UserRound aria-hidden="true" className="size-12 text-[#81869a]" strokeWidth={1.5} />
                    )}
                    <label
                      className="absolute -bottom-2 -right-2 flex size-9 cursor-pointer items-center justify-center rounded-xl bg-[#514ddd] text-white shadow-lg hover:bg-[#4542ca]"
                      title="Cambiar foto"
                    >
                      {isUploadingPicture ? (
                        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                      ) : (
                        <Camera aria-hidden="true" className="size-4" />
                      )}
                      <span className="sr-only">Cambiar foto de perfil</span>
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="sr-only"
                        disabled={isUploadingPicture}
                        onChange={(event) => void handlePictureChange(event)}
                      />
                    </label>
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{displayName}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#43506a]">
                      {phoneVerified && (
                        <span className="flex items-center gap-1.5 rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b4a40]">
                          <BadgeCheck aria-hidden="true" className="size-3.5" />
                          Comensal verificado
                        </span>
                      )}
                      {profile.nickname && <span className="font-semibold text-[#514ddd]">@{profile.nickname}</span>}
                      {memberSince && (
                        <span className="flex items-center gap-1.5">
                          <Calendar aria-hidden="true" className="size-4" />
                          Miembro desde {memberSince}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6d6e7a]">{profile.email}</p>
                  </div>
                </div>
              </section>

              <div className="grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
                {/* Información general */}
                <form onSubmit={handleSubmit} className={`${card} space-y-6`} noValidate>
                  <div>
                    <h2 className="text-2xl font-extrabold">Información general</h2>
                    <p className="text-xs text-[#43506a]">Actualiza tus credenciales públicas y contacto</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-bold">Foto de perfil</span>
                    <div className="flex flex-col gap-4 rounded-2xl bg-[#f3f5ff] p-4 sm:flex-row sm:items-center">
                      <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                        {profile.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element -- URL de R2 o Google
                          <img src={profile.picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                        ) : (
                          <UserRound aria-hidden="true" className="size-9 text-[#81869a]" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="space-y-3">
                        <p className="text-xs text-[#6d6e7a]">Formatos permitidos: JPG, PNG o WEBP. Máx 5 MB.</p>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#e6eaff] px-4 py-2.5 text-sm font-bold text-[#514ddd] hover:bg-[#dbe1ff]">
                            {isUploadingPicture ? (
                              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                            ) : (
                              <Upload aria-hidden="true" className="size-4" />
                            )}
                            {isUploadingPicture ? "Subiendo..." : "Cambiar foto"}
                            <input
                              type="file"
                              accept={IMAGE_ACCEPT}
                              className="sr-only"
                              disabled={isUploadingPicture}
                              onChange={(event) => void handlePictureChange(event)}
                            />
                          </label>
                          {profile.picture && (
                            <button
                              type="button"
                              onClick={() => void savePicture(null)}
                              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#d6154a] hover:bg-[#fde0e3]"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="block space-y-2">
                    <span className="flex items-center justify-between text-sm font-bold">
                      Nombre completo
                      <span className="text-xs font-medium text-[#6d6e7a]">Visible en tus reservaciones</span>
                    </span>
                    <span className={fieldShell}>
                      <IdCard aria-hidden="true" className="size-5 text-[#81869a]" />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-base outline-none"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      />
                    </span>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-bold">Apodo o nombre de usuario</span>
                    <span className={fieldShell}>
                      <AtSign aria-hidden="true" className="size-5 text-[#514ddd]" />
                      <input
                        maxLength={30}
                        className="min-w-0 flex-1 bg-transparent text-base outline-none"
                        value={form.nickname}
                        onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                      />
                    </span>
                    <span className="block text-xs text-[#6d6e7a]">
                      Tu apodo se muestra en comentarios, reseñas gastronómicas y listas públicas.
                    </span>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="profile-phone" className="text-sm font-bold">
                        Número de teléfono
                      </label>
                      {phoneVerified && !pendingPhone && (
                        <span className="flex items-center gap-1.5 rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b4a40]">
                          <CheckCircle2 aria-hidden="true" className="size-3.5" />
                          Teléfono verificado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`${fieldShell} flex-1`}>
                        <span className="text-sm font-bold">+57</span>
                        <input
                          id="profile-phone"
                          inputMode="numeric"
                          maxLength={10}
                          className="min-w-0 flex-1 bg-transparent text-base outline-none"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                        />
                      </span>
                      <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6eaff] text-[#514ddd] sm:flex">
                        <Smartphone aria-hidden="true" className="size-5" />
                      </span>
                    </div>
                    <p className="text-xs text-[#6d6e7a]">
                      Si cambias tu número, te enviaremos un código SMS para verificarlo. Mientras tanto conservas el
                      anterior.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <LogoutButton />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={discardChanges}
                        className="rounded-2xl bg-[#e6eaff] px-6 py-3.5 text-sm font-bold text-[#26344d] hover:bg-[#dbe1ff]"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca] disabled:opacity-60"
                      >
                        <Save aria-hidden="true" className="size-4" />
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </form>

                <aside className="space-y-6">
                  {pendingPhone ? (
                    <PhoneCodePanel
                      phone={pendingPhone}
                      onVerify={confirmPhone}
                      onResend={async () => {
                        await sendPhoneCode(pendingPhone);
                      }}
                      onCancel={cancelPhoneChange}
                    />
                  ) : (
                    <section className={`${card} space-y-4`}>
                      <h2 className="flex items-center gap-3 text-xl font-extrabold">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                          <ShieldCheck aria-hidden="true" className="size-5" />
                        </span>
                        Seguridad de la cuenta
                      </h2>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center justify-between rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <span className="text-[#43506a]">Correo</span>
                          <span className="truncate pl-3 font-semibold">{profile.email}</span>
                        </li>
                        <li className="flex items-center justify-between rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <span className="text-[#43506a]">Teléfono</span>
                          <span className={`font-bold ${phoneVerified ? "text-[#0b6b5c]" : "text-[#d6154a]"}`}>
                            {phoneVerified ? "Verificado" : "Sin verificar"}
                          </span>
                        </li>
                        <li className="flex items-center justify-between rounded-xl bg-[#f3f5ff] px-4 py-3">
                          <span className="text-[#43506a]">Estado de la cuenta</span>
                          <span className="font-bold">{profile.status === "ACTIVE" ? "Activa" : profile.status}</span>
                        </li>
                      </ul>
                      <p className="text-xs text-[#6d6e7a]">
                        Cuando cambies tu teléfono, aquí aparecerá la verificación por SMS.
                      </p>
                    </section>
                  )}
                </aside>
              </div>

              <section id="mis-resenas" className={`${card} scroll-mt-24 space-y-5`}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                    <MessageSquare aria-hidden="true" className="size-5" />
                  </span>
                  Mis reseñas
                </h2>
                <MyReviewsList />
              </section>

              <PrivacySettings profile={profile} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
