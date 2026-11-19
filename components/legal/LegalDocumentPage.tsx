import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; content: ReactNode };

type LegalDocumentPageProps = {
  title: string;
  version: string;
  effectiveDate: string;
  intro: ReactNode;
  sections: LegalSection[];
};

// Estructura común de /legal/privacy y /legal/terms (Server Component): encabezado con versión y
// vigencia, índice y secciones numeradas con ancla. Pensada para leerse bien en el celular.
export default function LegalDocumentPage({ title, version, effectiveDate, intro, sections }: LegalDocumentPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-5 py-10 text-[#17243d] sm:px-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Legal</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="text-sm text-[#6d6e7a]">
          Versión {version} · Vigente desde el {effectiveDate}
        </p>
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Borrador para revisión de la universidad o de un asesor antes de publicar la aplicación. No constituye asesoría jurídica.
        </p>
        <div className="space-y-3 text-base leading-relaxed text-[#43506a]">{intro}</div>
      </header>

      <nav aria-label="Contenido" className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6d6e7a]">Contenido</p>
        <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="font-semibold text-[#514ddd] hover:underline">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-bold">
            {index + 1}. {section.title}
          </h2>
          <div className="space-y-3 leading-relaxed text-[#43506a] [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {section.content}
          </div>
        </section>
      ))}

      <p className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e4e6f0] pt-6 text-sm">
        <Link href="/legal/privacy" className="font-semibold text-[#514ddd] hover:underline">
          Política de datos
        </Link>
        <Link href="/legal/terms" className="font-semibold text-[#514ddd] hover:underline">
          Términos y condiciones
        </Link>
        <Link href="/legal/community-guidelines" className="font-semibold text-[#514ddd] hover:underline">
          Normas de la comunidad
        </Link>
        <Link href="/" className="font-semibold text-[#514ddd] hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
