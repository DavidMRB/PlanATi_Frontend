// Versiones de los textos publicados en /legal/privacy y /legal/terms. Deben coincidir con
// PRIVACY_POLICY_VERSION y TERMS_VERSION del backend (app/core/config.py); si no, el registro y la
// re-aceptación responden 409 CONSENT_VERSION_OUTDATED. Al publicar un texto nuevo se cambian a la vez
// esta constante, la página /legal/* y la variable del backend: ConsentGate pide aceptar de nuevo.
export const PRIVACY_POLICY_VERSION = "2026-11-01";
export const TERMS_VERSION = "2026-11-01";

// Fecha de vigencia en texto (la versión es la fecha de publicación).
export const LEGAL_EFFECTIVE_DATE = "1 de noviembre de 2026";

// Resumen de qué cambió en la versión vigente; ConsentGate lo muestra al pedir la nueva aceptación.
// Actualizarlo junto con las versiones.
export const LEGAL_CHANGE_SUMMARY = [
  "Publicamos la política de tratamiento de datos personales (Ley 1581 de 2012) y los términos de uso.",
  "Ahora puedes descargar tus datos y eliminar tu cuenta desde tu perfil, en «Privacidad y datos».",
  "Tu ubicación solo se usa en el momento para mostrarte lugares cercanos; no la guardamos.",
];

// Datos del responsable del tratamiento. **Borrador**: los debe completar y revisar la universidad o un
// asesor antes de publicar la app (los textos legales no son asesoría jurídica).
export const DATA_CONTROLLER = {
  name: "Equipo PlanATi (proyecto académico)",
  identification: "[Pendiente: documento o NIT del responsable]",
  address: "Cúcuta, Norte de Santander, Colombia",
  email: "[Pendiente: correo de contacto para datos personales]",
  phone: "[Pendiente: teléfono de contacto]",
} as const;

export type LegalDocument = "PRIVACY_POLICY" | "TERMS";

export const LEGAL_DOCUMENT_LABEL: Record<LegalDocument, string> = {
  PRIVACY_POLICY: "Política de tratamiento de datos personales",
  TERMS: "Términos y condiciones",
};

export const LEGAL_DOCUMENT_HREF: Record<LegalDocument, string> = {
  PRIVACY_POLICY: "/legal/privacy",
  TERMS: "/legal/terms",
};

// Lo que se envía al registrarse (POST /auth/register y /auth/restaurant/register).
export function consentPayload() {
  return {
    accept_privacy_policy: true as const,
    accept_terms: true as const,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    terms_version: TERMS_VERSION,
  };
}
