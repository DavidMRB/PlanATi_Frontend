"use client";

import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from "lucide-react";
import SocialButton from "@/components/ui/SocialButton";
import { useLoginForm } from "./LoginForm.ts";

type LoginFormProps = {
  onRegisterClick: () => void;
};

export default function LoginForm({ onRegisterClick }: LoginFormProps) {
  const {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    touched,
    setTouched,
    isSubmitting,
    submitError,
    emailIsValid,
    passwordIsValid,
    inputClass,
    handleSubmit,
  } = useLoginForm();

  return (
    <form className="mt-8 space-y-5 xl:mt-5 xl:space-y-3" onSubmit={handleSubmit} noValidate>
      <label className="block space-y-2 xl:space-y-1">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          <span>Correo electrónico</span>
          <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
        </span>
        <span className={`flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3 ${touched.email && !emailIsValid ? "ring-2 ring-red-500" : ""}`}>
          <Mail aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            placeholder="tu.nombre@ejemplo.com"
            pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
            title="Ingresa un correo válido, por ejemplo tu.nombre@ejemplo.com"
            className={inputClass}
          />
        </span>
      </label>

      <label className="block space-y-2 xl:space-y-1">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          <span>Contraseña</span>
          <a className="text-xs font-semibold text-[#4c4cdd] hover:underline" href="#forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
        </span>
        <span className={`flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3 ${touched.password && !passwordIsValid ? "ring-2 ring-red-500" : ""}`}>
          <LockKeyhole aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            placeholder="••••••••••••"
            minLength={8}
            pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
            title="Debe tener al menos 8 caracteres, una letra mayúscula y un símbolo especial"
            className={inputClass}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="text-[#81869a] transition hover:text-[#4c4cdd]"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-[#656979] xl:text-xs">
        <input type="checkbox" className="size-5 rounded border-[#d6d9e5] accent-[#4c4cdd]" />
        Recordarme en este dispositivo
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] text-base font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] xl:h-9 xl:rounded-lg xl:text-xs"
      >
        {isSubmitting ? "Validando..." : "Iniciar Sesión"}
        <ArrowRight aria-hidden="true" className="size-5 xl:size-4" />
      </button>
      {submitError && <p className="text-center text-xs font-medium text-red-600">{submitError}</p>}

      <div className="flex items-center gap-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9295a4] xl:mt-4">
        <span className="h-px flex-1 bg-[#e4e6f0]" />
        <span>o continúa con</span>
        <span className="h-px flex-1 bg-[#e4e6f0]" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SocialButton provider="google">Google</SocialButton>
        <SocialButton provider="facebook">Facebook</SocialButton>
      </div>

      <p className="rounded-xl bg-[#eef2ff] px-4 py-4 text-center text-sm text-[#676a79] xl:rounded-lg xl:py-3 xl:text-xs">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={onRegisterClick}
          className="font-bold text-[#168c83] hover:underline"
        >
          Regístrate aquí ↗
        </button>
      </p>
    </form>
  );
}