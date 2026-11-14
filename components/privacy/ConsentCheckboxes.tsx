"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ConsentValue = { privacy: boolean; terms: boolean };

export const EMPTY_CONSENT: ConsentValue = { privacy: false, terms: false };

export function consentsAccepted(value: ConsentValue): boolean {
  return value.privacy && value.terms;
}

type ConsentCheckboxesProps = {
  value: ConsentValue;
  onChange: (value: ConsentValue) => void;
  // Mostrar el error de las casillas sin marcar (tras intentar enviar).
  showError?: boolean;
  // Textos y casillas más pequeños (formulario de registro del login en escritorio).
  compact?: boolean;
  // Qué casillas mostrar (en la re-aceptación solo las de los documentos pendientes).
  documents?: { privacy?: boolean; terms?: boolean };
};

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" rel="noopener" className="font-semibold text-[#514ddd] underline underline-offset-2 hover:text-[#4542ca]">
      {children}
    </Link>
  );
}

// Autorización del tratamiento de datos (Ley 1581 de 2012) y aceptación de los términos. Las casillas
// vienen SIN marcar: la autorización debe ser previa, expresa e informada. Sin edad mínima (D10).
// Los enlaces abren en otra pestaña para no perder lo escrito en el formulario.
export default function ConsentCheckboxes({ value, onChange, showError = false, compact = false, documents }: ConsentCheckboxesProps) {
  const showPrivacy = documents?.privacy ?? true;
  const showTerms = documents?.terms ?? true;
  const text = compact ? "text-xs leading-5 xl:text-[11px] xl:leading-4" : "text-sm leading-6";
  const box = "mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[#514ddd]";
  const missing = (showPrivacy && !value.privacy) || (showTerms && !value.terms);

  return (
    <fieldset className="space-y-2.5">
      <legend className="sr-only">Autorización de datos y términos</legend>
      {showPrivacy && (
        <label className={`flex items-start gap-2.5 text-[#43506a] ${text}`}>
          <input
            type="checkbox"
            checked={value.privacy}
            onChange={(event) => onChange({ ...value, privacy: event.target.checked })}
            aria-invalid={showError && !value.privacy}
            className={box}
          />
          <span>
            He leído y acepto la <LegalLink href="/legal/privacy">Política de tratamiento de datos personales</LegalLink> y autorizo
            el tratamiento de mis datos para las finalidades allí descritas.
          </span>
        </label>
      )}
      {showTerms && (
        <label className={`flex items-start gap-2.5 text-[#43506a] ${text}`}>
          <input
            type="checkbox"
            checked={value.terms}
            onChange={(event) => onChange({ ...value, terms: event.target.checked })}
            aria-invalid={showError && !value.terms}
            className={box}
          />
          <span>
            Acepto los <LegalLink href="/legal/terms">Términos y condiciones</LegalLink> y las{" "}
            <LegalLink href="/legal/community-guidelines">Normas de la comunidad</LegalLink>.
          </span>
        </label>
      )}
      {showError && missing && (
        <p role="alert" className="text-xs font-medium text-red-600">
          Para continuar debes aceptar la política de datos y los términos.
        </p>
      )}
    </fieldset>
  );
}
