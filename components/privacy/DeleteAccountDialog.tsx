"use client";

import { AlertTriangle, Eye, EyeOff, Loader2, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError, apiErrorCode, type UserProfile } from "@/lib/auth-api";
import { deleteMyAccount, sendDeleteAccountCode } from "@/lib/privacy-api";

// Mensaje que muestra el inicio tras eliminar la cuenta (se lee una sola vez).
export const ACCOUNT_DELETED_FLASH_KEY = "planati:account-deleted";

type DeleteAccountDialogProps = {
  user: UserProfile;
  onClose: () => void;
};

const CONFIRM_WORD = "ELIMINAR";

// Eliminación de la cuenta (B8, DELETE /users/me). Pide escribir ELIMINAR y la contraseña o, en cuentas de
// Google (que no la conocen), un código SMS enviado al teléfono verificado. Solo rol `user`: restaurantes
// y admins deben pedirla a soporte (el backend responde 409 SUPPORT_REQUIRED).
// z-[70]: se puede abrir encima de ConsentGate (z-[60]).
export default function DeleteAccountDialog({ user, onClose }: DeleteAccountDialogProps) {
  const router = useRouter();
  const { clear } = useAuth();
  const canUseCode = user.phone_verified;
  const [method, setMethod] = useState<"password" | "code">(user.google_sub && canUseCode ? "code" : "password");
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isDeleting]);

  const isUser = user.role === "user";
  const proofReady = method === "password" ? password.length > 0 : /^\d{6}$/.test(code);
  const canDelete = confirmation.trim() === CONFIRM_WORD && proofReady && !isDeleting;
  const maskedPhone = user.phone_number ? `•••• ${user.phone_number.slice(-4)}` : "tu teléfono";

  const sendCode = async () => {
    setError("");
    setInfo("");
    setIsSending(true);
    try {
      await sendDeleteAccountCode();
      setCodeSent(true);
      setInfo(`Te enviamos un código de 6 dígitos al ${maskedPhone}.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "No fue posible enviar el código.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canDelete) return;
    setError("");
    setIsDeleting(true);
    try {
      await deleteMyAccount(
        method === "password" ? { confirmation: "ELIMINAR", password } : { confirmation: "ELIMINAR", code },
      );
      // El backend ya borró la cookie: se olvida la sesión en el cliente y se vuelve al inicio con un aviso.
      try {
        sessionStorage.clear();
        sessionStorage.setItem(ACCOUNT_DELETED_FLASH_KEY, "1");
      } catch {
        // Sin sessionStorage solo se pierde el aviso.
      }
      clear();
      router.replace("/");
    } catch (deleteError) {
      setIsDeleting(false);
      if (apiErrorCode(deleteError) === "SUPPORT_REQUIRED") {
        setError("Solicita la eliminación de tu cuenta a soporte.");
      } else if (deleteError instanceof ApiError && deleteError.status === 400) {
        setError(method === "password" ? "La contraseña no es correcta." : deleteError.message || "El código no es válido.");
      } else {
        setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar tu cuenta.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#17243d]/50 sm:items-center sm:p-4"
      role="presentation"
      onClick={() => !isDeleting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_24px_70px_rgba(38,47,99,0.3)] sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#fde0e3] text-[#a30f35]">
            <AlertTriangle aria-hidden="true" className="size-6" />
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar"
            className="flex size-9 items-center justify-center rounded-full text-[#81869a] hover:bg-[#f3f5fb] hover:text-[#17243d]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <h2 id="delete-account-title" className="mt-4 text-2xl font-extrabold text-[#17243d]">
          Eliminar mi cuenta
        </h2>

        {!isUser ? (
          <p className="mt-3 text-sm text-[#43506a]">
            Las cuentas de establecimientos y de administración no se eliminan desde aquí. Solicita la eliminación a soporte, con
            el correo de contacto que aparece en la política de datos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-5">
            <div className="space-y-2 text-sm text-[#43506a]">
              <p>
                Esta acción <strong className="text-[#a30f35]">no se puede deshacer</strong>. Se borrarán de forma definitiva:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Tus reseñas, sus fotos y las respuestas que recibieron (los promedios de los lugares se recalculan).</li>
                <li>Tus planes y recordatorios.</li>
                <li>Tus favoritos y tus notificaciones.</li>
                <li>Tu nombre, apodo, foto, correo y teléfono.</li>
              </ul>
              <p className="text-xs text-[#6d6e7a]">
                Conservamos, sin tus datos personales, la constancia de las autorizaciones que diste y el registro de moderación,
                como exige la ley. Si quieres una copia de tus datos, descárgala antes desde «Privacidad y datos».
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-[#26344d]">
                Escribe <span className="font-mono text-[#a30f35]">{CONFIRM_WORD}</span> para confirmar
              </span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-11 w-full rounded-xl bg-[#eef2ff] px-4 font-mono text-sm tracking-widest outline-none ring-2 ring-transparent focus:ring-[#d6154a]/40"
              />
            </label>

            {method === "password" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-[#26344d]">Tu contraseña</span>
                <span className="flex h-11 items-center gap-2 rounded-xl bg-[#eef2ff] px-4 ring-2 ring-transparent focus-within:ring-[#6868e8]/40">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-[#81869a] hover:text-[#4c4cdd]"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </span>
              </label>
            ) : (
              <div className="space-y-2">
                <span className="text-sm font-bold text-[#26344d]">Código enviado por SMS</span>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    aria-label="Código de 6 dígitos"
                    disabled={!codeSent}
                    className="h-11 min-w-0 flex-1 rounded-xl bg-[#eef2ff] px-4 font-mono text-lg tracking-[0.4em] outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={isSending}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#0b6b5c] px-4 text-sm font-bold text-white hover:bg-[#095a4d] disabled:opacity-60"
                  >
                    {isSending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <MessageSquare aria-hidden="true" className="size-4" />}
                    {codeSent ? "Reenviar" : "Enviar código"}
                  </button>
                </div>
                {info && <p className="text-xs font-medium text-[#0b6b5c]">{info}</p>}
              </div>
            )}

            {canUseCode && (
              <button
                type="button"
                onClick={() => {
                  setMethod((current) => (current === "password" ? "code" : "password"));
                  setError("");
                }}
                className="text-xs font-semibold text-[#514ddd] hover:underline"
              >
                {method === "password" ? "Confirmar con un código SMS en lugar de la contraseña" : "Confirmar con mi contraseña"}
              </button>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="h-11 rounded-xl px-5 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5fb]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canDelete}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a30f35] px-5 text-sm font-bold text-white hover:bg-[#8a0c2c] disabled:opacity-50"
              >
                {isDeleting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                Eliminar mi cuenta definitivamente
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
