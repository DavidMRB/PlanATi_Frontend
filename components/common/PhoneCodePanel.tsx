"use client";

import { CheckCircle2, Lock, MessageSquare, Timer } from "lucide-react";
import { useState, type FormEvent } from "react";

type PhoneCodePanelProps = {
  phone: string; // 10 dígitos, sin prefijo
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onCancel: () => void;
};

// Panel de verificación por SMS: 6 casillas sobre un único input real (accesible y con pegado).
export default function PhoneCodePanel({ phone, onVerify, onResend, onCancel }: PhoneCodePanelProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== 6 || isVerifying) return;

    setError("");
    setInfo("");
    setIsVerifying(true);
    try {
      await onVerify(code);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "No fue posible verificar el código.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      await onResend();
      setInfo("Te enviamos un nuevo código.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "No fue posible reenviar el código.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section
      aria-labelledby="phone-code-title"
      className="space-y-5 rounded-3xl bg-[#eef2ff] p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#514ddd] text-white">
            <MessageSquare aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="phone-code-title" className="text-xl font-extrabold">
              Verificación SMS
            </h2>
            <p className="text-xs text-[#43506a]">Protección de dos pasos</p>
          </div>
        </div>
        <span className="rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b4a40]">En línea</span>
      </div>

      <p className="text-sm leading-6 text-[#43506a]">
        Enviamos un código de seguridad de 6 dígitos por SMS al <strong>+57 {phone}</strong> para confirmar la
        propiedad del número. Hasta que lo verifiques, conservas tu número anterior.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone-code-input" className="text-[11px] font-bold uppercase tracking-widest text-[#26344d]">
            Código de 6 dígitos
          </label>
          <div className="relative mt-2">
            <div className="grid grid-cols-6 gap-2" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  key={index}
                  className={`flex h-14 items-center justify-center rounded-xl bg-white text-2xl font-extrabold ${
                    code[index]
                      ? "text-[#17243d]"
                      : index === code.length
                        ? "text-[#c9cdf4] ring-2 ring-[#514ddd]/40"
                        : "text-[#c9cdf4]"
                  }`}
                >
                  {code[index] ?? "•"}
                </span>
              ))}
            </div>
            <input
              id="phone-code-input"
              autoFocus
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              aria-label="Código de verificación de 6 dígitos"
              className="absolute inset-0 size-full cursor-text opacity-0"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        {info && <p className="text-xs font-medium text-emerald-700">{info}</p>}

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#43506a]">
            <Timer aria-hidden="true" className="size-3.5" />
            ¿No te llegó el código?
          </span>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending}
            className="font-bold text-[#514ddd] hover:underline disabled:opacity-60"
          >
            {isResending ? "Enviando..." : "Reenviar SMS"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={code.length !== 6 || isVerifying}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0b6b5c] text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,107,92,0.25)] hover:bg-[#095a4d] disabled:opacity-50"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {isVerifying ? "Verificando..." : "Validar código"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-2xl bg-white px-5 text-sm font-semibold text-[#26344d] hover:bg-[#f8f9ff]"
          >
            Cancelar
          </button>
        </div>
      </form>

      <p className="flex items-center gap-2 text-xs text-[#6d6e7a]">
        <Lock aria-hidden="true" className="size-3.5" />
        Conexión cifrada de extremo a extremo
      </p>
    </section>
  );
}
