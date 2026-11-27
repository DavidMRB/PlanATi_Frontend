"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { ApiError, authEndpoint, getAuthFile } from "@/lib/auth-api";

export default function ExcelExportButton({ path, label, filename }: { path: string; label: string; filename: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      const file = await getAuthFile(authEndpoint(path));
      if (file?.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        throw new Error("La API no devolvió un archivo de Excel.");
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "No se pudo descargar el Excel. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-[#dce1f2] bg-white px-4 py-2 text-sm font-bold text-[#514ddd] hover:bg-[#eef0ff] focus-visible:outline-2 focus-visible:outline-[#514ddd] disabled:opacity-60">
        {busy ? <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" /> : <Download aria-hidden="true" className="size-4 shrink-0" />}
        {busy ? "Preparando Excel…" : label}
      </button>
      {error && <p role="alert" className="text-xs text-[#a30f35]">{error}</p>}
    </div>
  );
}
