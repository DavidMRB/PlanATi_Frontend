import type { ReactNode } from "react";
import RequireRole from "@/components/common/RequireRole";

// Los planes son solo de cuentas `user` con el teléfono verificado (el backend exige lo mismo).
export default function PlansLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["user"]} requireVerifiedPhone>
      {children}
    </RequireRole>
  );
}
