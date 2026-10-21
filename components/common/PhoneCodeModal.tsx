"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

type PhoneCodeModalProps = {
  phone: string; // 10 dígitos, sin prefijo
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onCancel: () => void;
};

export default function PhoneCodeModal({ phone, onVerify, onResend, onCancel }: PhoneCodeModalProps) {
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
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243d]/45 px-5 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-code-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-[#17243d] shadow-[0_24px_70px_rgba(38,47,99,0.24)]"
      >
        <button
          type="button"
          aria-label="Cancelar verificación"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-[#81869a] transition hover:bg-[#eef2ff] hover:text-[#4c4cdd]"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <div className="pr-6">
          <h2 id="phone-code-title" className="text-lg font-bold">
            Verifica tu nuevo número
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#676a79]">
            Ingresa los 6 dígitos que enviamos por SMS al <span className="font-semibold">+57 {phone}</span>. Hasta
            que lo verifiques, conservas tu número anterior.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            autoFocus
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            aria-label="Código de verificación de 6 dígitos"
            className="h-14 w-full rounded-xl bg-[#eef2ff] text-center text-2xl font-bold tracking-[0.45em] text-[#17243d] outline-none transition focus:ring-2 focus:ring-[#6868e8]/30"
          />
          {error && (
            <p role="alert" className="text-center text-xs font-medium text-red-600">
              {error}
            </p>
          )}
          {info && <p className="text-center text-xs font-medium text-emerald-700">{info}</p>}
          <button
            type="submit"
            disabled={code.length !== 6 || isVerifying}
            className="h-11 w-full rounded-xl bg-[#514ddd] text-sm font-bold text-white transition hover:bg-[#4542ca] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verificando..." : "Confirmar número"}
          </button>
          <div className="flex items-center justify-between text-xs font-semibold">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="text-[#4c4cdd] hover:underline disabled:opacity-60"
            >
              {isResending ? "Enviando..." : "Reenviar código"}
            </button>
            <button type="button" onClick={onCancel} className="text-[#6d6e7a] hover:text-red-600">
              Mantener mi número anterior
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
