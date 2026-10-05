import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";

type RegisterFormProps = {
  onLoginClick: () => void;
};

export default function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className="mt-8 space-y-5 xl:mt-5 xl:space-y-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="block space-y-2 xl:space-y-1">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          <span>Nombre completo</span>
          <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
        </span>
        <span className="flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3">
          <UserRound aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
          <input
            required
            type="text"
            placeholder="Tu nombre"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]"
          />
        </span>
      </label>

      <label className="block space-y-2 xl:space-y-1">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          <span>Correo electrónico</span>
          <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
        </span>
        <span className="flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3">
          <Mail aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
          <input
            required
            type="email"
            placeholder="tu.nombre@ejemplo.com"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]"
          />
        </span>
      </label>

      <label className="block space-y-2 xl:space-y-1">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          <span>Contraseña</span>
          <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
        </span>
        <span className="flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3">
          <LockKeyhole aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
          <input
            required
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]"
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

      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] text-base font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] xl:h-9 xl:rounded-lg xl:text-xs"
      >
        Crear mi cuenta
        <ArrowRight aria-hidden="true" className="size-5 xl:size-4" />
      </button>

      <p className="rounded-xl bg-[#eef2ff] px-4 py-4 text-center text-sm text-[#676a79] xl:rounded-lg xl:py-3 xl:text-xs">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={onLoginClick}
          className="font-bold text-[#168c83] hover:underline"
        >
          Inicia sesión ↗
        </button>
      </p>
    </form>
  );
}
