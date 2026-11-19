import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Normas de la comunidad · PlanATi",
  description: "Qué se puede publicar en PlanATi, cómo moderamos y qué pasa con el contenido bloqueado.",
};

const VERSION = "1.0";
const UPDATED = "13 de noviembre de 2026";

// Categorías de moderación (app/models/review.py, MODERATION_CATEGORIES) con su explicación.
const CATEGORIES: Array<[string, string]> = [
  ["Lenguaje ofensivo o insultos", "Groserías, burlas o ataques contra el personal, otros clientes o cualquier persona."],
  ["Discriminación o discurso de odio", "Contenido que ataca a alguien por su origen, género, orientación, religión, discapacidad u otra condición."],
  ["Datos personales de terceros", "Nombres completos, teléfonos, direcciones, placas o fotos que identifiquen a otras personas sin su permiso."],
  ["Spam o publicidad", "Enlaces, promociones, códigos de descuento o mensajes repetidos que no son una opinión real."],
  ["Información falsa o engañosa", "Reseñas de lugares que no visitaste, hechos inventados o reseñas pagadas."],
  ["Contenido sexual o violento", "Imágenes o textos sexuales, violentos o que inciten a hacer daño."],
  ["Contenido ilegal", "Cualquier contenido que infrinja la ley colombiana."],
  ["No relacionado con el lugar", "Texto que no habla de la experiencia en el establecimiento."],
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-5 py-10 text-[#17243d] sm:px-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Legal</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Normas de la comunidad</h1>
        <p className="text-sm text-[#6d6e7a]">
          Versión {VERSION} · Actualizadas el {UPDATED}
        </p>
        <p className="text-base leading-relaxed text-[#43506a]">
          PlanATi funciona porque las opiniones son reales y respetuosas. Estas normas aplican a reseñas, fotos, respuestas de los
          establecimientos y cualquier otro contenido que publiques.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Qué sí puedes publicar</h2>
        <ul className="list-disc space-y-2 pl-5 text-[#43506a]">
          <li>Tu experiencia real en el lugar: comida, servicio, precios, ambiente, accesibilidad.</li>
          <li>Críticas, aunque sean negativas, siempre que sean respetuosas y sobre el lugar.</li>
          <li>Fotos que tomaste tú del lugar, de los platos o de la carta.</li>
          <li>Los establecimientos pueden responder a las reseñas con el mismo respeto que esperan de sus clientes.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Qué no está permitido</h2>
        <dl className="divide-y divide-[#e4e6f0] rounded-2xl bg-white shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
          {CATEGORIES.map(([title, description]) => (
            <div key={title} className="space-y-1 px-5 py-4">
              <dt className="font-semibold">{title}</dt>
              <dd className="text-sm text-[#43506a]">{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Cómo moderamos</h2>
        <p className="text-[#43506a]">
          Cualquier persona puede reportar contenido con el botón “Reportar”. Un administrador revisa cada reporte y, según el caso:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[#43506a]">
          <li>
            <strong>Bloquea el comentario.</strong> En lugar del texto aparece “El comentario fue bloqueado por una violación a las
            políticas de la aplicación.”. Tus estrellas siguen contando en el promedio y solo tú ves tu texto original, con el
            motivo del bloqueo. Si lo reescribes, un administrador lo revisará antes de volver a publicarlo.
          </li>
          <li>
            <strong>Quita una foto</strong> si solo la imagen incumple las normas.
          </li>
          <li>
            <strong>Oculta la reseña</strong> si es falsa o spam: deja de verse y sale del promedio.
          </li>
          <li>
            <strong>Elimina la reseña</strong> cuando el contenido es ilegal.
          </li>
          <li>
            <strong>Suspende la cuenta</strong> en casos graves o de reincidencia. Una cuenta suspendida no puede iniciar sesión.
          </li>
        </ul>
        <p className="text-[#43506a]">
          Siempre recibirás una notificación con el motivo cuando moderemos tu contenido, y quien reportó sabrá que el reporte fue
          revisado (no quién lo hizo ni lo contrario).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">¿Crees que nos equivocamos?</h2>
        <p className="text-[#43506a]">
          Escríbenos a soporte desde el correo de tu cuenta indicando el contenido y por qué crees que cumple estas normas. Revisaremos
          el caso.
        </p>
      </section>

      <p className="text-sm">
        <Link href="/" className="font-semibold text-[#514ddd] hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
