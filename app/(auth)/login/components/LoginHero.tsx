type LoginHeroProps = {
  isRight?: boolean;
};

export default function LoginHero({ isRight = false }: LoginHeroProps) {
  return (
    <aside
      className={`relative hidden h-full min-h-0 overflow-hidden bg-cover bg-center md:flex md:flex-col md:justify-between md:p-7 xl:p-5 ${
        isRight
          ? "rounded-r-[1.25rem] xl:rounded-r-[0.75rem]"
          : "rounded-l-[1.25rem] xl:rounded-l-[0.75rem]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(12,25,56,0.08) 0%, rgba(7,19,42,0.88) 100%), url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=85')",
      }}
    >
      <div className="flex items-center justify-between text-xs font-bold tracking-[0.12em] text-white">
        <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur-md">
          PLANATI · CÚCUTA
        </span>
        <span className="text-white/75">EST. 2025</span>
      </div>
      <div className="max-w-sm space-y-4 text-white xl:space-y-3">
        <span className="inline-flex rounded-md bg-[#4c4cdd]/90 px-3 py-2 text-[0.68rem] font-bold tracking-[0.16em]">
          TU GUÍA LOCAL
        </span>
        <h2 className="text-5xl font-bold leading-[0.95] tracking-[-0.05em] xl:text-[2.6rem]">
          Descubre
          <br />
          <span className="text-[#5de1d0]">tu ciudad.</span>
        </h2>
        <p className="max-w-xs text-sm leading-5 text-white/75 xl:text-xs">
          Gastronomía, planes nocturnos, eventos culturales y rutas secretas de
          la Perla del Norte.
        </p>
      </div>
    </aside>
  );
}