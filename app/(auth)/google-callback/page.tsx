"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import { exchangeGoogleCode } from "@/lib/auth-api";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f9ff] px-5 py-10 text-[#17243d]">
      <div aria-hidden="true" className="absolute -left-32 top-0 size-96 rounded-full bg-[#514ddd]/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-[#5df0dc]/25 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl rounded-3xl bg-white px-6 py-10 text-center shadow-[0_24px_70px_rgba(38,47,99,0.12)] sm:px-12"
      >
        <div className="flex flex-col items-center gap-1.5">
          <BrandMark />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6d6e7a]">Conexión de cuenta segura</p>
        </div>

        {status === "loading" && (
          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="relative flex size-24 items-center justify-center">
              <span aria-hidden="true" className="absolute inset-0 rounded-full border-4 border-[#e6eaff]" />
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#514ddd] border-r-[#514ddd]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(23,36,61,0.12)]">
                <GoogleMark className="size-7" />
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#0b6b5c] text-white">
                  <Lock aria-hidden="true" className="size-2.5" />
                </span>
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Verificando credenciales con Google...</h1>
              <p className="mx-auto max-w-sm text-base text-[#43506a]">
                Estamos canjeando tu código de autenticación y sincronizando tu cuenta de forma segura. Un momento por
                favor.
              </p>
            </div>

            <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[#e6eaff]" role="progressbar" aria-label="Verificando">
              <motion.div
                className="h-full w-2/5 rounded-full bg-[#514ddd]"
                animate={{ x: ["-100%", "250%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <span className="flex items-center gap-2 rounded-full bg-[#eef0ff] px-4 py-2 text-xs font-semibold text-[#26344d]">
              <ShieldCheck aria-hidden="true" className="size-4 text-[#0b6b5c]" />
              Protocolo seguro OAuth 2.0
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 flex flex-col items-center gap-6">
            <span className="flex size-20 items-center justify-center rounded-full bg-[#fde0e3] text-[#d6154a]">
              <AlertCircle aria-hidden="true" className="size-9" />
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Error de autenticación</h1>
              <p role="alert" className="mx-auto max-w-sm text-base text-[#d6154a]">
                {errorMessage}
              </p>
            </div>
            <Link
              href="/login"
              replace
              className="flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[#514ddd] text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd]"
            >
              <span>Volver a intentar iniciar sesión</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </motion.section>

      <p className="relative mt-6 flex items-center gap-2 text-xs text-[#6d6e7a]">
        <ShieldCheck aria-hidden="true" className="size-4 text-[#0b6b5c]" />
        Conexión cifrada con Google Identity
      </p>
    </main>
  );
}
