"use client";

import { motion } from "framer-motion";
import { Camera, Check, Phone, UserRound } from "lucide-react";
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

export default function CompleteProfileForm() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [hasRegisteredPhone, setHasRegisteredPhone] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
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
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !/^3[0-9]{9}$/.test(phone)) {
      return;
    }

    void postAuthRequest(AUTH_ENDPOINTS.saveProfile, {
      username: username.trim(),
      phone,
      phoneVerified: isPhoneVerified,
      profileImage,
    });
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
            <label className="group relative block size-28 cursor-pointer rounded-full bg-[#eef2ff]">
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
          <p className="text-center text-xs text-[#858895]">
            Agrega una foto de perfil
          </p>

          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
              <span>Nombre de usuario</span>
              <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
            </span>
            <span className="flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/30">
              <UserRound aria-hidden="true" className="size-5 text-[#81869a]" />
              <input
                required
                maxLength={30}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
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
            <span className="flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 focus-within:ring-2 focus-within:ring-[#6868e8]/30">
              <Phone aria-hidden="true" className="size-5 text-[#81869a]" />
              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="3[0-9]{9}"
                value={phone}
                disabled={isProfileLoading || hasRegisteredPhone}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                  setIsPhoneVerified(false);
                }}
                placeholder="3000000000"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8e92a3] disabled:cursor-not-allowed disabled:text-[#858895]"
              />
              <button
                type="button"
                disabled={phone.length !== 10 || isPhoneVerified || isProfileLoading}
                className="text-xs font-bold text-[#4c4cdd] disabled:cursor-not-allowed disabled:text-[#9b9dad]"
              >
                {isPhoneVerified ? (
                  <span className="flex items-center gap-1 text-[#168c83]">
                    <Check aria-hidden="true" className="size-4" />
                    Verificado
                  </span>
                ) : (
                  "Verificar"
                )}
              </button>
            </span>
          </label>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#514ddd] text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd]"
          >
            Guardar y continuar
          </button>
        </form>
      </motion.section>
    </main>
  );
}
