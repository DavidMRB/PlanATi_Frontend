import { ArrowRight, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; content: ReactNode };

type LegalDocumentPageProps = {
  title: string;
  mobileTitle?: string;
  version: string;
  effectiveDate: string;
  intro: ReactNode;
  sections: LegalSection[];
  related: { href: string; title: string; action: string; description?: string };
  mobileAccordion?: boolean;
};

const contentStyle = "mt-4 space-y-3 border-t border-[#eceef7] pt-4 leading-relaxed text-[#43506a] [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5";
const headingStyle = "flex items-center gap-3 text-base font-bold sm:text-xl";
const sectionStyle = "rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.06)] sm:p-6";

export default function LegalDocumentPage({ title, mobileTitle, version, effectiveDate, intro, sections, related, mobileAccordion = false }: LegalDocumentPageProps) {
  return (
    <main className="bg-[#f6f7fc] px-4 pb-24 pt-5 text-[#17243d] sm:px-7 sm:py-9">
      <div className="mx-auto max-w-[74rem] space-y-5 md:max-lg:max-w-3xl">
        <header className="space-y-4 border-b border-[#e4e6f0] pb-5 sm:rounded-2xl sm:border-0 sm:bg-gradient-to-br sm:from-[#eef0ff] sm:via-white sm:to-[#e6faf6] sm:p-8 lg:p-10">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#514ddd]">
            <ShieldCheck aria-hidden="true" className="size-4" /> Términos legales
          </p>
          <h1 className="max-w-3xl text-[2rem] leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {mobileTitle ? <><span className="sm:hidden">{mobileTitle}</span><span className="hidden sm:inline">{title}</span></> : title}
          </h1>
          <p className="inline-flex rounded-full bg-[#c6f7f0] px-3 py-1.5 text-xs font-bold text-[#0b6b5c]">
            Versión {version} · Vigente desde el {effectiveDate}
          </p>
          <div className="max-w-3xl space-y-3 text-base leading-relaxed text-[#43506a]">{intro}</div>
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Borrador para revisión de la universidad o de un asesor antes de publicar la aplicación. No constituye asesoría jurídica.
          </p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav aria-label="Contenido" className="hidden rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)] md:block lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6d6e7a]">Contenido</p>
            <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="block rounded-lg bg-[#f4f5ff] px-3 py-2 font-semibold text-[#514ddd] hover:bg-[#e9ebff]">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 space-y-4">
            {sections.map((section, index) => {
              const heading = (
                <>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef0ff] text-[#514ddd]"><FileText aria-hidden="true" className="size-4" /></span>
                  <span>{index + 1}. {section.title}</span>
                </>
              );
              return (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <div className={`${sectionStyle} ${mobileAccordion ? "hidden sm:block" : ""}`}>
                    <h2 className={headingStyle}>{heading}</h2>
                    <div className={contentStyle}>{section.content}</div>
                  </div>
                  {mobileAccordion && (
                    // El navegador puede abrir el acordeón antes de que React hidrate la página.
                    <details suppressHydrationWarning className={`group ${sectionStyle} sm:hidden`}>
                      <summary className={`${headingStyle} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                        {heading}<ChevronDown aria-hidden="true" className="ml-auto size-4 shrink-0 text-[#514ddd] group-open:rotate-180" />
                      </summary>
                      <div className={contentStyle}>{section.content}</div>
                    </details>
                  )}
                </section>
              );
            })}
            <aside className="rounded-2xl bg-gradient-to-br from-[#514ddd] to-[#3730a3] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck aria-hidden="true" className="size-5 shrink-0" />{related.title}</h2>
                {related.description && <p className="max-w-md text-sm text-white/90">{related.description}</p>}
              </div>
              <Link href={related.href} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#3934b3] hover:bg-[#eef0ff] sm:mt-0">
                {related.action}<ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </aside>
          </div>
        </div>

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
      </div>
    </main>
  );
}
