"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ACCOUNT_DELETED_FLASH_KEY } from "./DeleteAccountDialog";

// Aviso de una sola vez en el inicio tras eliminar la cuenta (DeleteAccountDialog deja la marca).
export default function AccountDeletedNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        if (sessionStorage.getItem(ACCOUNT_DELETED_FLASH_KEY)) {
          sessionStorage.removeItem(ACCOUNT_DELETED_FLASH_KEY);
          setVisible(true);
        }
      } catch {
        // Sin sessionStorage no hay aviso.
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div role="status" className="bg-[#e3f7f3] px-5 py-3 text-sm text-[#0b4a40]">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="flex-1">
          <strong>Tu cuenta fue eliminada.</strong> Borramos tus reseñas, planes, favoritos y datos personales. Gracias por haber
          usado PlanATi.
        </p>
        <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar aviso" className="rounded-full p-1 hover:bg-white/60">
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
