import { Check, CircleAlert, Flag, Headphones, ShieldCheck } from "lucide-react";
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
    <main className="bg-[#f6f7fc] px-4 pb-24 pt-5 text-[#17243d] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-[74rem] space-y-5">
        <header className="space-y-4 rounded-3xl bg-gradient-to-br from-white via-[#eef0ff] to-[#e5f9f6] p-5 sm:p-9">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#514ddd]">
            <ShieldCheck aria-hidden="true" className="size-4" /> Políticas y convivencia
          </p>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Normas de la comunidad <span className="text-[#514ddd]">PlanATi</span></h1>
          <p className="inline-flex rounded-full bg-[#e3f7f3] px-3 py-1 text-xs font-bold text-[#0b6b5c]">
            Versión {VERSION} · Actualizadas el {UPDATED}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-[#43506a]">
            PlanATi funciona porque las opiniones son reales y respetuosas. Estas normas aplican a reseñas, fotos, respuestas de los
            establecimientos y cualquier otro contenido que publiques.
          </p>
        </header>

        <nav aria-label="En esta página" className="flex flex-wrap gap-2">
          <a className="rounded-full bg-[#e1f7f2] px-3 py-2 text-xs font-bold text-[#006c60]" href="#participar">Qué puedes publicar</a>
          <a className="rounded-full bg-[#eef0ff] px-3 py-2 text-xs font-bold text-[#514ddd]" href="#reportar">Cómo reportar</a>
        </nav>
        <div id="participar" className="grid items-start gap-5 md:grid-cols-2">
          <section className="space-y-4 rounded-2xl border-t-4 border-[#21bba5] bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Check aria-hidden="true" className="size-5 text-[#0b6b5c]" /> Qué sí puedes publicar</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-[#43506a] [&_li]:rounded-xl [&_li]:bg-[#edf9f6] [&_li]:p-3">
              <li>Tu experiencia real en el lugar: comida, servicio, precios, ambiente, accesibilidad.</li>
              <li>Críticas, aunque sean negativas, siempre que sean respetuosas y sobre el lugar.</li>
              <li>Fotos que tomaste tú del lugar, de los platos o de la carta.</li>
              <li>Los establecimientos pueden responder a las reseñas con el mismo respeto que esperan de sus clientes.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-2xl border-t-4 border-[#d6154a] bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold"><CircleAlert aria-hidden="true" className="size-5 text-[#a30f35]" /> Qué no está permitido</h2>
            <dl className="space-y-2">
              {CATEGORIES.map(([title, description]) => (
                <div key={title} className="space-y-1 rounded-xl bg-[#f3f5ff] p-3">
                  <dt className="font-semibold">{title}</dt>
                  <dd className="text-sm text-[#43506a]">{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section id="reportar" className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold">Cómo reportar en tres pasos</h2>
          <ol className="grid gap-3 text-sm text-[#43506a] sm:grid-cols-3">
            <li className="rounded-xl bg-[#eef0ff] p-4"><strong className="block text-[#514ddd]">1. Abre el contenido</strong> Busca la reseña, foto o ficha del establecimiento.</li>
            <li className="rounded-xl bg-[#eef0ff] p-4"><strong className="block text-[#514ddd]">2. Elige «Reportar»</strong> Selecciona el motivo y agrega detalles si los tienes.</li>
            <li className="rounded-xl bg-[#e3f7f3] p-4"><strong className="block text-[#006c60]">3. Envía el reporte</strong> Recibirás un aviso cuando termine la revisión.</li>
          </ol>
        </section>
        <section className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Flag aria-hidden="true" className="size-5 text-[#514ddd]" /> Cómo moderamos</h2>
          <p className="text-[#43506a]">
            Cualquier persona puede reportar contenido con el botón “Reportar”. Un administrador revisa cada reporte y, según el caso:
          </p>
          <ul className="grid gap-3 text-sm leading-relaxed text-[#43506a] sm:grid-cols-2 [&_li]:rounded-xl [&_li]:bg-[#f3f5ff] [&_li]:p-4">
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

        <section className="space-y-3 rounded-2xl bg-gradient-to-br from-[#514ddd] to-[#272452] p-5 text-white sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Headphones aria-hidden="true" className="size-5" /> ¿Crees que nos equivocamos?</h2>
          <p className="max-w-2xl leading-relaxed text-white/90">
            Escríbenos a soporte desde el correo de tu cuenta indicando el contenido y por qué crees que cumple estas normas. Revisaremos
            el caso.
          </p>
        </section>

        <p className="text-sm">
          <Link href="/" className="font-semibold text-[#514ddd] hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
