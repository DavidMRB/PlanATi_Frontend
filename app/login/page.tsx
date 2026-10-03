import BrandMark from "@/components/ui/BrandMark";
import LoginForm from "./components/LoginForm";
import LoginHero from "./components/LoginHero";
import LoginIntro from "./components/LoginIntro";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] px-5 py-8 text-[#17243d] sm:px-8 sm:py-12 md:flex md:items-center md:justify-center md:px-10 xl:bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] xl:px-0">
      <div className="w-full max-w-[1080px] md:overflow-hidden md:rounded-[1.25rem] md:bg-white md:shadow-[0_24px_70px_rgba(38,47,99,0.14)] xl:max-w-[820px] xl:rounded-[0.75rem]">
        <div className="flex justify-center pb-8 md:hidden">
          <BrandMark compact />
        </div>
        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          <LoginHero />
          <section className="mx-auto w-full max-w-[540px] md:max-w-none md:px-10 md:py-12 xl:px-8 xl:py-8">
            <div className="hidden pb-3 xl:block">
              <BrandMark compact />
            </div>
            <LoginIntro />
            <LoginForm />
          </section>
        </div>
      </div>
      <footer className="fixed bottom-3 left-0 hidden w-full justify-center gap-4 text-xs text-[#989baa] xl:flex">
        <a href="#terms" className="hover:text-[#4c4cdd]">Términos de servicio</a>
        <span aria-hidden="true">•</span>
        <a href="#privacy" className="hover:text-[#4c4cdd]">Política de privacidad</a>
        <span aria-hidden="true">•</span>
        <span className="font-semibold text-[#198e83]">● Cúcuta Segura</span>
      </footer>
    </main>
  );
}