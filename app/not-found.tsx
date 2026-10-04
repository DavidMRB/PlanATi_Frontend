import { Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9ff] px-5 py-8 text-[#12213a]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 -top-36 size-[24rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,77,221,0.92),rgba(79,77,221,0)_68%)] blur-2xl sm:-left-20 sm:-top-44 sm:size-[32rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 right-[-8rem] size-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(75,224,215,0.62),rgba(75,224,215,0)_68%)] blur-3xl"
      />

      <section className="relative flex w-full max-w-[1120px] flex-col items-center text-center">
        <Link
          href="/"
          className="text-xl font-bold tracking-[-0.04em] text-[#4c4cdd] transition hover:text-[#3535bb]"
        >
          PlanATi
        </Link>

        <div className="mt-12 flex flex-col items-center md:mt-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9efff] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#4b5268] shadow-[0_6px_16px_rgba(63,79,155,0.06)]">
            <span className="size-2 rounded-full bg-[#087f73]" />
            <span className="md:hidden">HTTP status code</span>
            <span className="hidden md:inline">HTTP 404 • Página no encontrada</span>
          </div>

          <div className="relative mt-8 md:mt-6">
            <span
              aria-hidden="true"
              className="absolute inset-x-4 top-1/2 -z-10 h-28 -translate-y-1/2 rounded-full bg-[#9ff2ec]/70 blur-3xl md:h-40"
            />
            <p className="bg-[linear-gradient(180deg,#5c57ee_20%,#176c99_100%)] bg-clip-text text-[7rem] font-black leading-[0.78] tracking-[-0.05em] text-transparent sm:text-[9rem] md:text-[10rem]">
              404
            </p>
            <div className="absolute -inset-5 -z-10 rounded-full border border-dashed border-[#a3b5ef]/70" />
          </div>

          <h1 className="mt-8 text-[2rem] font-bold tracking-[-0.045em] text-[#10203b] sm:text-[2.35rem] md:mt-4">
            Página no encontrada
          </h1>
          <p className="mt-3 max-w-[31rem] text-base leading-6 text-[#53586c] sm:text-lg">
            El recurso que buscas no existe o ha sido movido. Esta plantilla está
            lista para cualquier código de estado HTTP.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#514ddd] px-7 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd]"
            >
              <Home aria-hidden="true" className="size-4" />
              Volver al inicio
            </Link>
            <a
              href=""
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#c9f5f3] px-7 text-sm font-bold text-[#087f73] transition hover:bg-[#b6eeeb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087f73]"
            >
              <RefreshCcw aria-hidden="true" className="size-4" />
              Reintentar
            </a>
          </div>
        </div>

        <footer className="mt-16 text-xs text-[#53586c] md:mt-20">
          © PlanATi. All rights reserved.
        </footer>
      </section>
    </main>
  );
}