"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  CloudUpload,
  Info,
  Loader2,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Timer,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ConsentCheckboxes, { EMPTY_CONSENT, type ConsentValue } from "@/components/privacy/ConsentCheckboxes";
import { useAuth } from "@/components/providers/AuthProvider";
import BrandMark from "@/components/ui/BrandMark";
import {
  ApiError,
  AUTH_ENDPOINTS,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
} from "@/lib/auth-api";
import { CONSENT_OUTDATED_MESSAGE, acceptConsents, isConsentVersionOutdated } from "@/lib/privacy-api";
import { IMAGE_ACCEPT, uploadImage, validateImageFile } from "@/lib/uploads";

type ProfileResponse = {
  full_name?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean;
  nickname?: string | null;
  picture?: string | null;
  status?: string;
  pending_consents?: Array<"PRIVACY_POLICY" | "TERMS">;
  user?: ProfileResponse;
};

type SmsResponse = {
  success?: boolean;
  verified?: boolean;
  message?: string;
};

export default function CompleteProfileForm() {
  const router = useRouter();
  const { refresh: refreshSession } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [hasRegisteredPhone, setHasRegisteredPhone] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [imageTouched, setImageTouched] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Las cuentas de Google se crean en el callback, antes de ver las casillas: aceptan aquí (B8).
  // Las de correo ya aceptaron al registrarse y no ven esta sección.
  const [pendingConsents, setPendingConsents] = useState<Array<"PRIVACY_POLICY" | "TERMS">>([]);
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [consentTouched, setConsentTouched] = useState(false);

  const phoneIsValid = /^3[0-9]{9}$/.test(phone);

  useEffect(() => {
    const loadProfile = async () => {
      const storedPhone = sessionStorage.getItem("registrationPhone") ?? "";
      if (storedPhone) {
        setPhone(storedPhone);
      }

      if (!AUTH_ENDPOINTS.profile) {
        setIsProfileLoading(false);
        return;
      }

      try {
        const response = await getAuthRequest<ProfileResponse>(AUTH_ENDPOINTS.profile);
        const profile = response?.user ?? response;
        if (!profile) {
          router.replace("/login");
          return;
        }

        // Si el usuario ya completó el perfil y verificó su teléfono, redirigir a inicio
        if (profile.phone_verified && profile.nickname && profile.status === "ACTIVE") {
          router.replace("/");
          return;
        }

        const registeredPhone = profile?.phone_number?.replace(/\D/g, "").slice(-10) ?? "";
        if (registeredPhone) {
          setPhone(registeredPhone);
          setHasRegisteredPhone(true);
        }
        if (profile.nickname) {
          setUsername(profile.nickname);
        }
        if (profile.full_name) {
          setFullName(profile.full_name);
        }
        if (profile.picture) {
          setProfileImage(profile.picture);
        }
        setIsPhoneVerified(profile?.phone_verified ?? false);
        setPendingConsents(profile.pending_consents ?? []);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setProfileError(
          error instanceof Error ? error.message : "No fue posible cargar tu perfil.",
        );
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setImageTouched(true);
    const validationError = validateImageFile(file);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Vista previa local mientras sube; al terminar se guarda la URL pública de R2, que sí persiste.
    const previousImage = profileImage;
    const localPreview = URL.createObjectURL(file);
    setFormError("");
    setProfileImage(localPreview);
    setIsUploadingImage(true);
    try {
      setProfileImage(await uploadImage("avatars", file));
    } catch (uploadError) {
      setProfileImage(previousImage);
      setFormError(uploadError instanceof Error ? uploadError.message : "No fue posible subir la foto.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPhoneTouched(true);
    setUsernameTouched(true);
    setImageTouched(true);
    setFormError("");

    if (!username.trim() || !profileImage || !phoneIsValid) {
      setFormError("Completa tu nombre de usuario, agrega una foto y usa un número colombiano válido.");
      return;
    }

    if (!isPhoneVerified) {
      void openVerification();
      return;
    }

    const needsPrivacy = pendingConsents.includes("PRIVACY_POLICY");
    const needsTerms = pendingConsents.includes("TERMS");
    setConsentTouched(true);
    if ((needsPrivacy && !consent.privacy) || (needsTerms && !consent.terms)) {
      setFormError("Para terminar debes aceptar la política de datos y los términos.");
      return;
    }

    // Primero la autorización (canal GOOGLE_COMPLETE_PROFILE) y después el perfil.
    void (pendingConsents.length > 0 ? acceptConsents() : Promise.resolve(undefined))
      .then(() => {
        setPendingConsents([]);
        return patchAuthRequest(AUTH_ENDPOINTS.saveProfile, {
          nickname: username.trim(),
          phone_number: `+57${phone}`,
          picture: profileImage,
        });
      })
      .then(async () => {
        // El navbar del sitio lee la sesión del AuthProvider: se refresca para que muestre el apodo nuevo.
        await refreshSession();
        router.push("/");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setFormError(
          isConsentVersionOutdated(error)
            ? CONSENT_OUTDATED_MESSAGE
            : error instanceof Error
              ? error.message
              : "No fue posible guardar tu perfil.",
        );
      });
  };

  const openVerification = async () => {
    setPhoneTouched(true);
    setUsernameTouched(true);
    setImageTouched(true);
    setFormError("");

    if (!username.trim() || !profileImage || !phoneIsValid) {
      setFormError("Completa tu nombre de usuario, agrega una foto y usa un número colombiano válido.");
      return;
    }

    if (isPhoneVerified || isSendingCode || isProfileLoading) {
      return;
    }

    setVerificationCode("");
    setVerificationError("");
    setIsSendingCode(true);
    try {
      const response = await postAuthRequest<{ phone_number: string }, SmsResponse>(
        AUTH_ENDPOINTS.requestSms,
        { phone_number: `+57${phone}` },
      );
      if (response?.success === false) {
        throw new Error(response.message ?? "No fue posible enviar el código.");
      }
      setIsVerificationOpen(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setVerificationError(
        error instanceof Error ? error.message : "No fue posible enviar el código.",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verificationCode.length !== 6 || isVerifyingCode) {
      return;
    }

    setVerificationError("");
    setIsVerifyingCode(true);
    try {
      const response = await postAuthRequest<
        { phone_number: string; code: string },
        SmsResponse
      >(
        AUTH_ENDPOINTS.verifySms,
        { phone_number: `+57${phone}`, code: verificationCode },
      );
      if (response?.verified === false) {
        throw new Error(response.message ?? "El código no es válido.");
      }
      const profileResponse = AUTH_ENDPOINTS.profile
        ? await getAuthRequest<ProfileResponse>(AUTH_ENDPOINTS.profile)
        : undefined;
      const profile = profileResponse?.user ?? profileResponse;
      const isVerified = profile?.phone_verified ?? response?.verified ?? true;

      if (!isVerified) {
        throw new Error("El número todavía no aparece verificado.");
      }

      setIsPhoneVerified(true);
      setIsVerificationOpen(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setVerificationError(
        error instanceof Error ? error.message : "No fue posible verificar el código.",
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const card = "rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8";
  const canSubmit =
    !isProfileLoading && !isSendingCode && !isUploadingImage && !!username.trim() && !!profileImage && phoneIsValid;
  const formattedPhone = phone ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`.trim() : "";

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] text-[#17243d]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandMark />
        <p className="text-xs font-semibold text-[#6d6e7a]">Paso final de registro</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl space-y-8 px-5 pb-12 pt-4 sm:px-8"
      >
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e6eaff] px-3 py-1 text-xs font-bold text-[#514ddd]">
            <BadgeCheck aria-hidden="true" className="size-3.5" />
            Paso final de registro (2 de 2)
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Completa tu perfil</h1>
          <p className="max-w-2xl text-base text-[#43506a]">
            Personaliza tu cuenta en PlanATi para acceder a reservas en tiempo real, planes gastronómicos y
            experiencias exclusivas.
          </p>
        </div>

        {profileError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_28rem]">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* 1. Fotografía */}
            <section className={`${card} space-y-5`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <Camera aria-hidden="true" className="size-6 text-[#514ddd]" />
                  1. Fotografía de perfil
                </h2>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    profileImage ? "bg-[#c6f7f0] text-[#0b6b5c]" : "bg-[#fde0e3] text-[#d6154a]"
                  }`}
                >
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${profileImage ? "bg-[#0b6b5c]" : "bg-[#d6154a]"}`} />
                  {profileImage ? "Foto cargada" : "Foto obligatoria"}
                </span>
              </div>

              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <span
                  className={`relative flex size-32 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] ring-4 ${
                    imageTouched && !profileImage ? "ring-red-500" : "ring-[#514ddd]"
                  }`}
                >
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL de R2, Google o blob: local
                    <img
                      src={profileImage}
                      alt="Vista previa de la foto de perfil"
                      referrerPolicy="no-referrer"
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <UserRound aria-hidden="true" className="size-14 text-[#81869a]" strokeWidth={1.5} />
                  )}
                  {profileImage && !isUploadingImage && (
                    <span className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-[#0b6b5c] text-white">
                      <Check aria-hidden="true" className="size-4" />
                    </span>
                  )}
                </span>

                <div className="w-full space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#514ddd] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]">
                      <CloudUpload aria-hidden="true" className="size-4" />
                      {profileImage ? "Cambiar fotografía" : "Subir fotografía"}
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={(event) => void handleImageChange(event)}
                        className="sr-only"
                      />
                    </label>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileImage("")}
                        className="rounded-xl bg-[#e6eaff] px-5 py-3 text-sm font-bold text-[#26344d] hover:bg-[#dbe1ff]"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#43506a]">
                    Formatos válidos: JPG, PNG o WebP. Máximo 5 MB. Recomendado: encuadre cuadrado centrado.
                  </p>
                  {isUploadingImage && (
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#514ddd]">
                      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      Subiendo fotografía...
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Nombre de usuario */}
            <section className={`${card} space-y-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <AtSign aria-hidden="true" className="size-6 text-[#514ddd]" />
                  2. Nombre de usuario
                </h2>
                {username.trim() && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#0b6b5c]">
                    <CheckCircle2 aria-hidden="true" className="size-4" />@{username.trim()}
                  </span>
                )}
              </div>
              <label
                className={`flex h-14 items-center gap-3 rounded-2xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 ${
                  usernameTouched && !username.trim() ? "ring-2 ring-red-500" : ""
                }`}
              >
                <AtSign aria-hidden="true" className="size-5 text-[#514ddd]" />
                <input
                  required
                  maxLength={30}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onBlur={() => setUsernameTouched(true)}
                  placeholder="Tu nombre de usuario"
                  aria-label="Nombre de usuario"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8e92a3]"
                />
              </label>
              <p className="flex items-center gap-2 text-xs text-[#6d6e7a]">
                <Info aria-hidden="true" className="size-3.5" />
                Este alias identificará tus recomendaciones y reseñas locales.
              </p>
            </section>

            {/* 3. Teléfono */}
            <section className={`${card} space-y-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <Smartphone aria-hidden="true" className="size-6 text-[#514ddd]" />
                  3. Número telefónico (Colombia)
                </h2>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isPhoneVerified ? "bg-[#c6f7f0] text-[#0b6b5c]" : "bg-[#eef0ff] text-[#43506a]"
                  }`}
                >
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${isPhoneVerified ? "bg-[#0b6b5c]" : "bg-[#9295a4]"}`} />
                  {isPhoneVerified ? "Verificado" : "Pendiente de verificación"}
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 gap-3">
                  <span className="flex h-14 items-center rounded-2xl bg-[#eef2ff] px-4 text-sm font-bold">+57</span>
                  <label
                    className={`flex h-14 flex-1 items-center gap-3 rounded-2xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 ${
                      phoneTouched && !phoneIsValid ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="3[0-9]{9}"
                      title="Ingresa un número celular colombiano de 10 dígitos que empiece por 3"
                      value={phone}
                      disabled={isProfileLoading || hasRegisteredPhone}
                      onChange={(event) => {
                        setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                        setIsPhoneVerified(false);
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="3000000000"
                      aria-label="Número de teléfono"
                      className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8e92a3] disabled:cursor-not-allowed disabled:text-[#858895]"
                    />
                    <span className="text-xs text-[#6d6e7a]">10 dígitos</span>
                  </label>
                </div>
                {!isPhoneVerified && (
                  <button
                    type="button"
                    onClick={() => void openVerification()}
                    disabled={isSendingCode || isProfileLoading || isUploadingImage}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0b6b5c] px-6 text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,107,92,0.25)] hover:bg-[#095a4d] disabled:opacity-50"
                  >
                    <MessageSquare aria-hidden="true" className="size-4" />
                    {isSendingCode ? "Enviando..." : "Verificar número"}
                  </button>
                )}
              </div>
              <p className="text-xs text-[#6d6e7a]">
                Te enviaremos un SMS gratuito con un código de seguridad OTP para garantizar reservas seguras.
              </p>
            </section>

            {/* 4. Autorización de datos (solo cuentas de Google sin aceptar) */}
            {pendingConsents.length > 0 && (
              <section className={`${card} space-y-4`}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <ScrollText aria-hidden="true" className="size-6 text-[#514ddd]" />
                  4. Autorización de datos
                </h2>
                <ConsentCheckboxes
                  value={consent}
                  onChange={setConsent}
                  showError={consentTouched}
                  documents={{ privacy: pendingConsents.includes("PRIVACY_POLICY"), terms: pendingConsents.includes("TERMS") }}
                />
              </section>
            )}

            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {formError}
              </p>
            )}
            {verificationError && !isVerificationOpen && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {verificationError}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-semibold text-[#43506a] hover:text-[#514ddd]"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Regresar
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-2xl bg-[#514ddd] px-8 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPhoneVerified ? "Guardar y continuar" : "Verificar número"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            {/* Verificación SMS */}
            <section className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]">
              <div aria-hidden="true" className="h-1.5 bg-[linear-gradient(90deg,#514ddd,#0b6b5c)]" />
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-3 text-xl font-extrabold">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
                      <MessageSquare aria-hidden="true" className="size-5" />
                    </span>
                    <span>
                      Verificación SMS
                      {isVerificationOpen && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0b6b5c]">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0b6b5c]" />
                          Código enviado
                        </span>
                      )}
                    </span>
                  </h2>
                  <span className="rounded-md bg-[#eef0ff] px-2 py-1 font-mono text-[10px] text-[#43506a]">OTP 2FA</span>
                </div>

                {isPhoneVerified ? (
                  <p className="flex items-center gap-2 rounded-2xl bg-[#e3f7f3] px-4 py-4 text-sm font-semibold text-[#0b6b5c]">
                    <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
                    Tu número +57 {formattedPhone} ya está verificado.
                  </p>
                ) : isVerificationOpen ? (
                  <form onSubmit={verifyPhone} className="space-y-5">
                    <p className="text-sm text-[#43506a]">
                      Ingresa el código de 6 dígitos que enviamos al <strong>+57 {formattedPhone}</strong>.
                    </p>
                    <div className="relative">
                      <div className="grid grid-cols-6 gap-2" aria-hidden="true">
                        {Array.from({ length: 6 }, (_, index) => (
                          <span
                            key={index}
                            className={`flex h-14 items-center justify-center rounded-xl text-2xl font-extrabold ${
                              verificationCode[index]
                                ? "bg-[#eef0ff] text-[#514ddd]"
                                : index === verificationCode.length
                                  ? "bg-[#eef0ff] ring-2 ring-[#514ddd]/40"
                                  : "bg-[#f3f5ff] text-[#c9cdf4]"
                            }`}
                          >
                            {verificationCode[index] ?? "•"}
                          </span>
                        ))}
                      </div>
                      <input
                        autoFocus
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                        aria-label="Código de verificación de 6 dígitos"
                        className="absolute inset-0 size-full cursor-text opacity-0"
                      />
                    </div>
                    {verificationError && (
                      <p role="alert" className="text-xs font-medium text-red-600">
                        {verificationError}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#6d6e7a]">
                        <Timer aria-hidden="true" className="size-3.5" />
                        ¿No te llegó el código?
                      </span>
                      <button
                        type="button"
                        onClick={() => void openVerification()}
                        disabled={isSendingCode}
                        className="font-bold text-[#514ddd] hover:underline disabled:opacity-50"
                      >
                        {isSendingCode ? "Enviando..." : "Reenviar ahora"}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={verificationCode.length !== 6 || isVerifyingCode}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b6b5c] text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,107,92,0.25)] hover:bg-[#095a4d] disabled:opacity-50"
                    >
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      {isVerifyingCode ? "Verificando..." : "Confirmar código"}
                    </button>
                  </form>
                ) : (
                  <p className="rounded-2xl bg-[#f3f5ff] px-4 py-5 text-sm text-[#43506a]">
                    Cuando pulses <strong>Verificar número</strong> te enviaremos un código de 6 dígitos por SMS y
                    podrás confirmarlo aquí.
                  </p>
                )}
              </div>
            </section>

            {/* Vista previa */}
            <section className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#6d6e7a]">Vista previa en vivo</p>
                <span className="rounded-md bg-[#e6eaff] px-2 py-1 text-[10px] font-bold text-[#514ddd]">Tu perfil</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef2ff] ring-2 ring-white">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL de R2, Google o blob: local
                    <img src={profileImage} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                  ) : (
                    <UserRound aria-hidden="true" className="size-9 text-[#81869a]" strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-extrabold">{fullName || username.trim() || "Tu nombre"}</p>
                  <p className="truncate font-mono text-sm text-[#0b6b5c]">@{username.trim() || "usuario"}</p>
                  {isPhoneVerified && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#0b6b5c]">
                      <Check aria-hidden="true" className="size-3.5" />
                      Teléfono verificado
                    </p>
                  )}
                </div>
              </div>
            </section>

            <p className="flex items-start gap-3 rounded-2xl bg-white/70 px-5 py-4 text-xs text-[#43506a]">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#514ddd]" />
              Tus datos están protegidos y solo se usan para personalizar tu experiencia y verificar tu cuenta.
            </p>
          </aside>
        </div>
      </motion.div>
    </main>
  );
}
