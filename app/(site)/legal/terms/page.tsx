import type { Metadata } from "next";
import Link from "next/link";
import LegalDocumentPage, { type LegalSection } from "@/components/legal/LegalDocumentPage";
import { DATA_CONTROLLER, LEGAL_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones · PlanATi",
  description: "Reglas de uso de PlanATi para personas usuarias y establecimientos.",
};

// Al cambiar el texto se actualizan a la vez TERMS_VERSION (lib/legal.ts) y la variable del backend.
const SECTIONS: LegalSection[] = [
  {
    id: "servicio",
    title: "Qué es PlanATi",
    content: (
      <p>
        PlanATi es una plataforma para descubrir establecimientos de Cúcuta (restaurantes, cafés, bares, hoteles, experiencias y
        tiendas), consultar su información, publicar reseñas, guardar favoritos y organizar planes de visita. PlanATi no vende los
        productos de los establecimientos ni hace reservas: los planes son una agenda personal y el total que muestran es un estimado
        con los precios publicados.
      </p>
    ),
  },
  {
    id: "cuenta",
    title: "Tu cuenta",
    content: (
      <ul>
        <li>Para reseñar, guardar favoritos y crear planes necesitas una cuenta con tu número de celular verificado.</li>
        <li>Los datos que registras deben ser reales y tuyos. Eres responsable de lo que se haga con tu cuenta y de cuidar tu contraseña.</li>
        <li>Puedes eliminar tu cuenta cuando quieras desde tu perfil, en «Privacidad y datos».</li>
      </ul>
    ),
  },
  {
    id: "contenido",
    title: "Contenido que publicas",
    content: (
      <>
        <ul>
          <li>Tus reseñas deben contar una experiencia real en el lugar y cumplir las normas de la comunidad.</li>
          <li>Solo puedes subir fotos tomadas por ti o que tengas derecho a usar.</li>
          <li>
            Sigues siendo dueño de tu contenido, pero nos autorizas a mostrarlo en PlanATi, junto con tu apodo y tu foto, mientras tu
            cuenta exista.
          </li>
        </ul>
        <p>
          El contenido que incumpla las{" "}
          <Link href="/legal/community-guidelines" className="font-semibold text-[#514ddd] hover:underline">
            Normas de la comunidad
          </Link>{" "}
          puede bloquearse, ocultarse o eliminarse, y en casos graves o de reincidencia la cuenta puede suspenderse.
        </p>
      </>
    ),
  },
  {
    id: "establecimientos",
    title: "Establecimientos aliados",
    content: (
      <ul>
        <li>Cada solicitud de registro la revisa un administrador antes de publicar el establecimiento.</li>
        <li>
          El establecimiento es responsable de que su información (nombre, ubicación, horarios, carta, precios y fotos) sea veraz y esté
          al día.
        </li>
        <li>Puede responder a las reseñas con respeto, pero no puede pedir ni ofrecer beneficios a cambio de reseñas.</li>
        <li>Un administrador puede corregir la información del local, suspenderlo o retirarlo si incumple estos términos.</li>
      </ul>
    ),
  },
  {
    id: "prohibido",
    title: "Usos no permitidos",
    content: (
      <ul>
        <li>Publicar reseñas falsas, pagadas o sobre tu propio establecimiento.</li>
        <li>Suplantar a otra persona o crear cuentas para evadir una suspensión.</li>
        <li>Intentar acceder a cuentas o datos ajenos, o interferir con el funcionamiento de la plataforma.</li>
        <li>Extraer información de forma masiva o automatizada.</li>
      </ul>
    ),
  },
  {
    id: "responsabilidad",
    title: "Responsabilidad",
    content: (
      <p>
        La información de cada lugar la publica el propio establecimiento y las reseñas reflejan la opinión de sus autores. PlanATi
        procura que el servicio funcione sin interrupciones y modera el contenido reportado, pero no garantiza que la información de los
        establecimientos sea exacta en todo momento ni responde por los productos o servicios que ellos prestan.
      </p>
    ),
  },
  {
    id: "datos",
    title: "Datos personales",
    content: (
      <p>
        El tratamiento de tus datos se rige por la{" "}
        <Link href="/legal/privacy" className="font-semibold text-[#514ddd] hover:underline">
          Política de tratamiento de datos personales
        </Link>
        .
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios y contacto",
    content: (
      <>
        <p>
          Estos términos rigen desde el {LEGAL_EFFECTIVE_DATE} (versión {TERMS_VERSION}). Si los cambiamos, te pediremos aceptarlos de
          nuevo la próxima vez que entres.
        </p>
        <p>
          Para dudas sobre estos términos escríbenos a {DATA_CONTROLLER.email}. Se aplican las leyes de la República de Colombia.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title="Términos y condiciones"
      related={{ href: "/legal/privacy", title: "Tu privacidad es fundamental", action: "Leer política de privacidad" }}
      version={TERMS_VERSION}
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      intro={<p>Al crear una cuenta o usar PlanATi aceptas estas condiciones. Léelas con calma: son cortas.</p>}
      sections={SECTIONS}
    />
  );
}
