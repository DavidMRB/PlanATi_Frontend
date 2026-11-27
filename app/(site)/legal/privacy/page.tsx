import type { Metadata } from "next";
import Link from "next/link";
import LegalDocumentPage, { type LegalSection } from "@/components/legal/LegalDocumentPage";
import { DATA_CONTROLLER, LEGAL_EFFECTIVE_DATE, PRIVACY_POLICY_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales · PlanATi",
  description: "Qué datos recoge PlanATi, para qué los usa, con quién los comparte y cómo ejercer tus derechos (Ley 1581 de 2012).",
};

// Contenido mínimo de la sección 7.9 del plan de la fase 2. Al cambiar el texto se actualizan a la vez
// PRIVACY_POLICY_VERSION (lib/legal.ts) y la variable del backend, y ConsentGate pide aceptar de nuevo.
const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Responsable del tratamiento",
    content: (
      <>
        <p>El responsable del tratamiento de tus datos personales es:</p>
        <ul>
          <li>
            <strong>Nombre:</strong> {DATA_CONTROLLER.name}
          </li>
          <li>
            <strong>Identificación:</strong> {DATA_CONTROLLER.identification}
          </li>
          <li>
            <strong>Domicilio:</strong> {DATA_CONTROLLER.address}
          </li>
          <li>
            <strong>Correo de contacto:</strong> {DATA_CONTROLLER.email}
          </li>
          <li>
            <strong>Teléfono:</strong> {DATA_CONTROLLER.phone}
          </li>
        </ul>
        <p>
          Esta política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y las demás
          normas colombianas sobre protección de datos personales.
        </p>
      </>
    ),
  },
  {
    id: "datos",
    title: "Datos que recogemos",
    content: (
      <ul>
        <li>
          <strong>Identificación y contacto:</strong> nombre, apodo, correo electrónico y número de celular.
        </li>
        <li>
          <strong>Foto de perfil</strong>, si la subes o si viene de tu cuenta de Google.
        </li>
        <li>
          <strong>Cuenta de Google</strong>, si inicias sesión con ella: el identificador de la cuenta, el nombre, el correo y la foto.
        </li>
        <li>
          <strong>Contenido que publicas:</strong> reseñas, puntuaciones, fotos de las reseñas y reportes.
        </li>
        <li>
          <strong>Uso del servicio:</strong> planes (lugar, fecha, platos y notas), favoritos y notificaciones.
        </li>
        <li>
          <strong>Ubicación:</strong> solo cuando la permites, en el momento, para mostrarte lugares cercanos. No la guardamos ni la
          registramos.
        </li>
        <li>
          <strong>Datos técnicos:</strong> la cookie de sesión y, al aceptar esta política, la dirección IP y el navegador como prueba
          de tu autorización.
        </li>
        <li>
          <strong>Establecimientos:</strong> además, los datos del local y de su responsable (nombre, dirección, ubicación, teléfono y
          correo de contacto), que se publican en el directorio.
        </li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    title: "Para qué usamos tus datos",
    content: (
      <ul>
        <li>Crear y gestionar tu cuenta y verificar tu número de celular.</li>
        <li>Mostrarte lugares cercanos y el mapa de establecimientos.</li>
        <li>Publicar tus reseñas con tu apodo y tu foto, y calcular las puntuaciones de los lugares.</li>
        <li>Gestionar tus planes, enviarte recordatorios y la invitación a reseñar después de la visita.</li>
        <li>Moderar el contenido según las normas de la comunidad y atender reportes.</li>
        <li>Proteger la plataforma: seguridad, prevención de fraude y de abusos.</li>
        <li>Enviarte comunicaciones del servicio (por ejemplo, avisos sobre tus reseñas o cambios en esta política).</li>
      </ul>
    ),
  },
  {
    id: "publicos",
    title: "Qué datos son públicos",
    content: (
      <p>
        En una reseña los demás ven solo tu apodo (o tu nombre si no tienes apodo) y tu foto de perfil. Nunca mostramos tu correo ni tu
        teléfono. Los datos de los establecimientos (nombre, dirección, ubicación en el mapa, teléfono y horarios) son públicos.
      </p>
    ),
  },
  {
    id: "proveedores",
    title: "Proveedores que tratan datos por nosotros",
    content: (
      <>
        <p>Para prestar el servicio usamos proveedores que tratan datos en nuestro nombre (encargados), algunos fuera de Colombia:</p>
        <ul>
          <li>
            <strong>Cloudflare R2:</strong> almacenamiento de las imágenes (fotos de perfil, de reseñas y de los establecimientos).
          </li>
          <li>
            <strong>Google:</strong> inicio de sesión con Google y mapas (Google Maps).
          </li>
          <li>
            <strong>Proveedor de SMS:</strong> envío de los códigos de verificación al celular.
          </li>
        </ul>
        <p>No vendemos tus datos ni los compartimos con terceros con fines publicitarios.</p>
      </>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    content: (
      <>
        <p>Como titular de los datos tienes derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber cómo hemos usado tus datos.</li>
          <li>Revocar la autorización y pedir la supresión de tus datos.</li>
          <li>Acceder gratis a tus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) cuando consideres que no atendimos tu solicitud.</li>
        </ul>
      </>
    ),
  },
  {
    id: "como-ejercerlos",
    title: "Cómo ejercer tus derechos",
    content: (
      <>
        <ul>
          <li>
            En tu <Link href="/profile#privacidad" className="font-semibold text-[#514ddd] hover:underline">perfil, sección «Privacidad y datos»</Link>:
            ves qué versiones aceptaste y cuándo, descargas una copia de tus datos y eliminas tu cuenta.
          </li>
          <li>Tu nombre, apodo, foto y teléfono los actualizas en el mismo perfil.</li>
          <li>Para cualquier otra consulta o reclamo, escríbenos a {DATA_CONTROLLER.email}.</li>
        </ul>
        <p>
          Respondemos las <strong>consultas en máximo 10 días hábiles</strong> y los <strong>reclamos en máximo 15 días hábiles</strong>,
          contados desde el día siguiente a su recibo. Si no podemos hacerlo en ese plazo, te diremos el motivo y la nueva fecha, que no
          superará los plazos que permite la ley.
        </p>
      </>
    ),
  },
  {
    id: "eliminacion",
    title: "Eliminación de la cuenta y conservación",
    content: (
      <>
        <p>
          Al eliminar tu cuenta borramos de forma definitiva tus reseñas (con sus fotos y respuestas), tus planes, favoritos y
          notificaciones, y tus datos de identificación y contacto.
        </p>
        <p>
          Conservamos, sin datos que te identifiquen, la constancia de las autorizaciones que diste (documento, versión, canal y fecha) y
          el registro de las acciones de moderación, para poder demostrar el cumplimiento de la ley y responder a reclamos. Las cuentas de
          establecimientos y de administración se eliminan a pedido por el correo de contacto.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad",
    content: (
      <p>
        La sesión usa una cookie protegida que el navegador no deja leer a otros scripts, las contraseñas se guardan como un hash (nunca en texto plano) y las
        acciones que modifican datos llevan protección contra solicitudes falsificadas (CSRF). Aun así, ningún sistema es infalible: si
        detectamos un incidente que afecte tus datos, te avisaremos y lo informaremos a la SIC.
      </p>
    ),
  },
  {
    id: "menores",
    title: "Menores de edad",
    content: (
      <p>
        PlanATi no está dirigido a niños, niñas ni adolescentes y no recoge a sabiendas sus datos. Si eres padre, madre o representante y
        crees que un menor nos dio sus datos, escríbenos para eliminarlos.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Vigencia y cambios",
    content: (
      <p>
        Esta política rige desde el {LEGAL_EFFECTIVE_DATE} (versión {PRIVACY_POLICY_VERSION}). Si la cambiamos, publicaremos la nueva
        versión en esta página y, la próxima vez que entres, te pediremos que la leas y la aceptes antes de seguir usando las funciones
        con cuenta.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Política de tratamiento de datos personales"
      mobileTitle="Privacidad y datos"
      mobileAccordion
      related={{ href: "/profile#privacidad", title: "Tú decides qué compartes", action: "Gestionar privacidad en mi perfil" }}
      version={PRIVACY_POLICY_VERSION}
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      intro={
        <p>
          En PlanATi te ayudamos a descubrir lugares de Cúcuta, reseñarlos y planear tus visitas. Para eso tratamos algunos datos
          personales. Aquí te contamos cuáles, para qué y cómo puedes consultarlos, corregirlos o pedir que los borremos.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
