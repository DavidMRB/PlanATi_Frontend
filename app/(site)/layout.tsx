import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/common/Navbar";
import PublicBottomBar from "@/components/common/PublicBottomBar";

// Páginas del sitio (inicio, explorar, detalle y perfil de usuario): comparten un único Navbar
// (escritorio y tablet) y una barra de pestañas inferior en móvil. El menú del avatar cambia según el rol
// de la sesión. Admin y restaurante tienen su propio layout con barra lateral, barra superior y guard de rol.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <PublicBottomBar />
    </>
  );
}
