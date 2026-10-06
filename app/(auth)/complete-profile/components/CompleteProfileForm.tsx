"use client";

import { motion } from "framer-motion";
import { Camera, Phone, UserRound, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import BrandMark from "@/components/ui/BrandMark";
import { AUTH_ENDPOINTS, getAuthRequest, postAuthRequest } from "@/lib/auth-api";

type ProfileResponse = {
  phone?: string;
  phoneVerified?: boolean;
  user?: {
    phone?: string;
    phoneVerified?: boolean;
  };
};

type SmsResponse = {
  success?: boolean;
  verified?: boolean;
  message?: string;
};

export default function CompleteProfileForm() {
  const [username, setUsername] = useState("");
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
        const registeredPhone = profile?.phone?.replace(/\D/g, "").slice(-10) ?? "";
        setPhone(registeredPhone);
        setHasRegisteredPhone(Boolean(registeredPhone));
        setIsPhoneVerified(profile?.phoneVerified ?? false);
      } catch (error) {
        setProfileError(
          error instanceof Error ? error.message : "No fue posible cargar tu perfil.",
        );
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setProfileImage(URL.createObjectURL(file));
    setImageTouched(true);
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

    void postAuthRequest(AUTH_ENDPOINTS.saveProfile, {
      username: username.trim(),
      phone,
      phoneVerified: isPhoneVerified,
      profileImage,
    }).catch((error) => {
      setFormError(
        error instanceof Error ? error.message : "No fue posible guardar tu perfil.",
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
      const response = await postAuthRequest<{ phone: string }, SmsResponse>(
        AUTH_ENDPOINTS.requestSms,
        { phone: `+57${phone}` },
      );
      if (response?.success === false) {
        throw new Error(response.message ?? "No fue posible enviar el código.");
      }
      setIsVerificationOpen(true);
    } catch (error) {
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
        { phone: string; code: string },
        SmsResponse
      >(AUTH_ENDPOINTS.verifySms, { phone: `+57${phone}`, code: verificationCode });
      if (response?.verified === false) {
        throw new Error(response.message ?? "El código no es válido.");
      }
      const profileResponse = AUTH_ENDPOINTS.profile
        ? await getAuthRequest<ProfileResponse>(AUTH_ENDPOINTS.profile)
        : undefined;
      const profile = profileResponse?.user ?? profileResponse;
      const isVerified = profile?.phoneVerified ?? response?.verified ?? true;

      if (!isVerified) {
        throw new Error("El número todavía no aparece verificado.");
      }

      setIsPhoneVerified(true);
      setIsVerificationOpen(false);
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "No fue posible verificar el código.",
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] px-5 py-10 text-[#17243d]">
      <motion.section
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] rounded-[1.25rem] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(38,47,99,0.14)] sm:px-10 sm:py-10"
      >
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#12213a]">
            Completa tu perfil
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-5 text-[#676a79]">
            Agrega tus datos para personalizar tu experiencia en PlanATi.
          </p>
        </div>

        {profileError && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </p>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="flex justify-center">
            <label className={`group relative block size-28 cursor-pointer rounded-full bg-[#eef2ff] ${
              imageTouched && !profileImage ? "ring-2 ring-red-500" : ""
            }`}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Vista previa de la foto de perfil"
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[#81869a]">
                  <UserRound aria-hidden="true" className="size-12" strokeWidth={1.5} />
                </span>
              )}
              <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-[#514ddd] text-white shadow-[0_5px_12px_rgba(81,77,221,0.3)] transition group-hover:bg-[#4542ca]">
                <Camera aria-hidden="true" className="size-4" />
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
          </div>
          <p className={`text-center text-xs ${imageTouched && !profileImage ? "text-red-600" : "text-[#858895]"}`}>
            {profileImage ? "Foto de perfil seleccionada" : "Agrega una foto de perfil (requerida)"}
          </p>

          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
              <span>Nombre de usuario</span>
              <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
            </span>
            <span className={`flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 ${
              usernameTouched && !username.trim() ? "ring-2 ring-red-500" : ""
            }`}>
              <UserRound aria-hidden="true" className="size-5 text-[#81869a]" />
              <input
                required
                maxLength={30}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onBlur={() => setUsernameTouched(true)}
                placeholder="Tu nombre de usuario"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8e92a3]"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
              <span>Número de teléfono</span>
              <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
            </span>
            <span
              className={`flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 ${
                phoneTouched && !phoneIsValid ? "ring-2 ring-red-500" : ""
              }`}
            >
              <Phone aria-hidden="true" className="size-5 text-[#81869a]" />
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
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8e92a3] disabled:cursor-not-allowed disabled:text-[#858895]"
              />
              {isPhoneVerified && (
                <span className="text-xs font-bold text-[#168c83]">Verificado</span>
              )}
            </span>
          </label>

          <button
            type="submit"
            disabled={
              isProfileLoading ||
              isSendingCode ||
              !username.trim() ||
              !profileImage ||
              !phoneIsValid
            }
            className="h-12 w-full rounded-xl bg-[#514ddd] text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingCode
              ? "Enviando código..."
              : isPhoneVerified
                ? "Guardar y continuar"
                : "Verificar número"}
          </button>
        </form>

        {formError && (
          <p role="alert" className="mt-4 text-center text-xs font-medium text-red-600">
            {formError}
          </p>
        )}
        {verificationError && !isVerificationOpen && (
          <p role="alert" className="mt-4 text-center text-xs font-medium text-red-600">
            {verificationError}
          </p>
        )}
      </motion.section>

      {isVerificationOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243d]/45 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVerificationOpen(false);
            }
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="verification-title" className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-[#17243d] shadow-[0_24px_70px_rgba(38,47,99,0.24)]">
            <button type="button" aria-label="Cerrar verificación" onClick={() => setIsVerificationOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-[#81869a] transition hover:bg-[#eef2ff] hover:text-[#4c4cdd]">
              <X aria-hidden="true" className="size-5" />
            </button>
            <div className="pr-6">
              <h2 id="verification-title" className="text-lg font-bold">Verifica tu número</h2>
              <p className="mt-2 text-sm leading-5 text-[#676a79]">Ingresa los 6 dígitos que enviamos por SMS al número registrado.</p>
            </div>
            <form onSubmit={verifyPhone} className="mt-5 space-y-4">
              <input
                autoFocus
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                aria-label="Código de verificación de 6 dígitos"
                className="h-14 w-full rounded-xl bg-[#eef2ff] text-center text-2xl font-bold tracking-[0.45em] text-[#17243d] outline-none transition focus:ring-2 focus:ring-[#6868e8]/30"
              />
              {verificationError && (
                <p role="alert" className="text-center text-xs font-medium text-red-600">
                  {verificationError}
                </p>
              )}
              <button type="submit" disabled={verificationCode.length !== 6 || isVerifyingCode} className="h-11 w-full rounded-xl bg-[#514ddd] text-sm font-bold text-white transition hover:bg-[#4542ca] disabled:cursor-not-allowed disabled:opacity-50">
                {isVerifyingCode ? "Verificando..." : "Confirmar número"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
