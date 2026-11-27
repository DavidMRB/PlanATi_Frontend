import type { ReactNode } from "react";
import AuthFooter from "@/components/layout/AuthFooter";
import Footer from "@/components/layout/Footer";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[1fr_auto]">
      <div className="grid">{children}</div>
      <AuthFooter fallback={<Footer compact />} />
    </div>
  );
}
