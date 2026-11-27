import Link from "next/link";

const legal = [
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/legal/terms", label: "Términos de uso" },
  { href: "/legal/community-guidelines", label: "Normas de la comunidad" },
];

export default function Footer({ compact = false }: { compact?: boolean }) {
  const copyright = "© " + new Date().getFullYear() + " PlanATi · Cúcuta";
  const legalLinks = legal.map(({ href, label }) => (
    <Link key={href} href={href} className="inline-block py-1.5 hover:text-[#514ddd] hover:underline">{label}</Link>
  ));

  if (compact) return (
    <footer className="border-t border-[#dce1f2] bg-[#f8f9ff] px-5 py-4 text-xs text-[#43506a]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <span>{copyright}</span>
        <nav aria-label="Información legal" className="flex flex-wrap gap-x-5">{legalLinks}</nav>
      </div>
    </footer>
  );

  return (
    <footer className="border-t border-[#dce1f2] bg-[#eff2fc] px-5 pt-9 pb-[calc(5rem+env(safe-area-inset-bottom))] text-sm text-[#43506a] md:pb-5">
      <div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-lg font-bold text-[#514ddd]">PlanATi Cúcuta</Link>
          <p className="mt-2 max-w-xs">Descubre establecimientos y organiza tus planes en Cúcuta, Norte de Santander.</p>
        </div>
        <nav aria-label="Explorar el sitio" className="flex flex-col items-start">
          <h2 className="mb-2 font-bold text-[#17243d]">Explorar</h2>
          <Link href="/explore" className="py-1.5 hover:underline">Directorio de lugares</Link>
          <Link href="/restaurant/register" className="py-1.5 hover:underline">Registrar un establecimiento</Link>
        </nav>
        <nav aria-label="Información legal" className="flex flex-col items-start">
          <h2 className="mb-2 font-bold text-[#17243d]">Información legal</h2>
          {legalLinks}
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl border-t border-[#dce1f2] pt-4 text-xs">{copyright}</p>
    </footer>
  );
}
