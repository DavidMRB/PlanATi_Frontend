"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import { exchangeGoogleCode } from "@/lib/auth-api";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const executedRef = useRef(false);

  useEffect(() => {
    // Evitar doble ejecución concurrente en React StrictMode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    // 1. Leer el código temporal de la URL
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    // 4. Quitar inmediatamente el código de la URL
    window.history.replaceState({}, document.title, window.location.pathname);

    if (!code) {
      setStatus("error");
      setErrorMessage(
        "No se proporcionó un código de autenticación válido o el enlace ya fue utilizado.",
      );
      return;
    }

    // 2. Enviar inmediatamente el código al backend para canjearlo por la cookie HttpOnly
    const handleExchange = async () => {
      try {
        const response = await exchangeGoogleCode(code);

        // 3. Usar los metadatos JSON para decidir si navega a / o a /complete-profile
        if (response.registration_complete) {
          router.replace("/");
        } else {
          router.replace("/complete-profile");
        }
      } catch (error) {
        // 5. Mostrar un error visible y permitir reintentar el inicio de sesión
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No fue posible verificar tu cuenta con Google. El código puede haber expirado o ya fue utilizado.",
        );
      }
    };

    void handleExchange();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] px-5 py-10 text-[#17243d]">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_24px_70px_rgba(38,47,99,0.12)]">
        <div className="flex justify-center pb-6">
          <BrandMark />
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4 text-center">
            <Loader2 className="size-10 animate-spin text-[#4c4cdd]" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#17243d]">
                Verificando credenciales
              </h2>
              <p className="text-sm text-[#6d6e7a]">
                Estamos validando tu inicio de sesión con Google. Espera un momento...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-5 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#17243d]">
                Error de autenticación
              </h2>
              <p className="text-sm text-red-600">
                {errorMessage}
              </p>
            </div>
            <Link
              href="/login"
              replace
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd]"
            >
              <span>Volver a intentar iniciar sesión</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
