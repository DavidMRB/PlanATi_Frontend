"use client";

import { Loader2, ScrollText } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LogoutButton from "@/components/common/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { CONSENT_REQUIRED_EVENT } from "@/lib/auth-api";
import { LEGAL_CHANGE_SUMMARY, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import { CONSENT_OUTDATED_MESSAGE, acceptConsents, isConsentVersionOutdated } from "@/lib/privacy-api";
import ConsentCheckboxes, { EMPTY_CONSENT, type ConsentValue } from "./ConsentCheckboxes";
import DeleteAccountDialog from "./DeleteAccountDialog";

// Rutas donde no se muestra: los textos legales (para poder leerlos), la cuenta suspendida y el
// registro con Google, que acepta con sus propias casillas en /complete-profile.
function isExempt(pathname: string) {
  return (
    pathname.startsWith("/legal/") ||
    pathname === "/account-suspended" ||
    pathname === "/complete-profile" ||
    pathname === "/google-callback"
  );
}

// Nueva aceptación de la política de datos y los términos (B8). Aparece si `user.pending_consents` no
// está vacío o si una petición responde 403 CONSENT_REQUIRED (lib/auth-api.ts emite el evento). No se
// puede cerrar: solo aceptar o cerrar sesión. Va en el layout raíz, dentro de AuthProvider.
export default function ConsentGate() {
  const { user, refresh } = useAuth();
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  // Hubo peticiones rechazadas en esta página: tras aceptar se recarga para repetirlas.
  const sawRejection = useRef(false);

  const hasPending = (user?.pending_consents?.length ?? 0) > 0;
  const hasPendingRef = useRef(hasPending);
  useEffect(() => {
    hasPendingRef.current = hasPending;
  }, [hasPending]);

  useEffect(() => {
    const onConsentRequired = () => {
      sawRejection.current = true;
      // El perfil trae `pending_consents`: al recargarlo, el modal aparece (p. ej. si la versión cambió
      // con la sesión abierta). Si ya se sabe que hay pendientes, no hace falta pedirlo otra vez.
      if (!hasPendingRef.current) void refresh();
    };
    window.addEventListener(CONSENT_REQUIRED_EVENT, onConsentRequired);
    return () => window.removeEventListener(CONSENT_REQUIRED_EVENT, onConsentRequired);
  }, [refresh]);

  const pending = user?.pending_consents ?? [];
  const open = !!user && pending.length > 0 && !isExempt(pathname);

  // Sin desplazamiento de la página de fondo mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const needsPrivacy = pending.includes("PRIVACY_POLICY");
  const needsTerms = pending.includes("TERMS");
  const accepted = (!needsPrivacy || consent.privacy) && (!needsTerms || consent.terms);

  const handleAccept = async () => {
    setTouched(true);
    if (!accepted) return;
    setIsSaving(true);
    setError("");
    try {
      await acceptConsents();
      if (sawRejection.current) {
        window.location.reload();
        return;
      }
      await refresh();
      setConsent(EMPTY_CONSENT);
      setTouched(false);
    } catch (acceptError) {
      setError(
        isConsentVersionOutdated(acceptError)
          ? CONSENT_OUTDATED_MESSAGE
          : acceptError instanceof Error
            ? acceptError.message
            : "No fue posible guardar tu aceptación.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#17243d]/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-gate-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_24px_70px_rgba(38,47,99,0.3)] sm:rounded-3xl sm:p-8"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#514ddd]">
          <ScrollText aria-hidden="true" className="size-6" />
        </span>
        <h2 id="consent-gate-title" className="mt-4 text-2xl font-extrabold text-[#17243d]">
          Actualizamos nuestras condiciones
        </h2>
        <p className="mt-2 text-sm text-[#43506a]">
          Para seguir usando PlanATi necesitamos que leas y aceptes la versión vigente (desde el {LEGAL_EFFECTIVE_DATE}).
        </p>

        <div className="mt-5 rounded-2xl bg-[#f3f5ff] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#514ddd]">Qué cambió</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#26344d]">
            {LEGAL_CHANGE_SUMMARY.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <ConsentCheckboxes
            value={consent}
            onChange={setConsent}
            showError={touched}
            documents={{ privacy: needsPrivacy, terms: needsTerms }}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <LogoutButton className="justify-center" />
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={isSaving}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-6 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca] disabled:opacity-60"
          >
            {isSaving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Aceptar y continuar
          </button>
        </div>
        <p className="mt-4 text-xs text-[#6d6e7a]">
          Si no estás de acuerdo, puedes cerrar sesión
          {user.role === "user" ? (
            <>
              {" "}
              o{" "}
              <button type="button" onClick={() => setDeleting(true)} className="font-semibold text-[#a30f35] underline underline-offset-2">
                eliminar tu cuenta
              </button>
            </>
          ) : (
            " o escribir al contacto de la política para pedir la eliminación de tu cuenta"
          )}
          .
        </p>
      </div>
      {deleting && <DeleteAccountDialog user={user} onClose={() => setDeleting(false)} />}
    </div>
  );
}
