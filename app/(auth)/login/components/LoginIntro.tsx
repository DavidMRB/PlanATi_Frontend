import { Hand } from "lucide-react";

type LoginIntroProps = {
  registering?: boolean;
};

export default function LoginIntro({ registering = false }: LoginIntroProps) {
  return (
    <header className="space-y-3 text-center md:text-left xl:space-y-2">
      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#5658dd] md:justify-start">
        <Hand aria-hidden="true" className="size-5" />
        <span>{registering ? "Únete a la comunidad" : "Hola de nuevo"}</span>
      </div>
      <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#12213a] sm:text-[2.35rem] xl:text-[1.85rem]">
        {registering ? "Crea tu cuenta" : "¡Bienvenido de nuevo!"}
      </h1>
      <p className="mx-auto max-w-md text-[0.98rem] leading-6 text-[#5f6374] md:mx-0 xl:text-xs xl:leading-5">
        {registering
          ? "Regístrate para descubrir los mejores planes de Cúcuta."
          : "Ingresa tus credenciales para continuar viviendo los mejores planes."}
      </p>
    </header>
  );
}