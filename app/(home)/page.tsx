import Link from "next/link";
import Navbar from "@/components/common/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-20 text-center text-[#17243d]">
        <h1 className="text-4xl font-bold leading-tight">Encuentra experiencias cerca de ti</h1>
        <p className="max-w-xl text-base text-[#6d6e7a]">
          Descubre restaurantes y establecimientos que se ajustan a lo que necesitas, con su carta, combos y fotos actualizadas.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/explore"
            className="rounded-xl bg-[#514ddd] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
          >
            Explorar establecimientos
          </Link>
          <Link
            href="/restaurant/register"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#4c4cdd] ring-1 ring-[#c9cdf4] hover:bg-[#f8f8ff]"
          >
            Registra tu restaurante
          </Link>
        </div>
      </main>
    </>
  );
}
