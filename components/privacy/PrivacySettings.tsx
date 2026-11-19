"use client";

import { Download, ExternalLink, Loader2, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/auth-api";
import { formatDate } from "@/lib/datetime";
import { LEGAL_DOCUMENT_HREF, LEGAL_DOCUMENT_LABEL, type LegalDocument } from "@/lib/legal";
import { CONSENT_CHANNEL_LABEL, downloadMyData, listMyConsents, type ConsentItem } from "@/lib/privacy-api";
import DeleteAccountDialog from "./DeleteAccountDialog";

const DOCUMENTS: LegalDocument[] = ["PRIVACY_POLICY", "TERMS"];

// Sección "Privacidad y datos" del perfil (B8, Ley 1581): qué versiones aceptó y cuándo, descargar sus
// datos (JSON, una vez por hora), los textos legales y eliminar la cuenta.
export default function PrivacySettings({ profile, className = "" }: { profile: UserProfile; className?: string }) {
  const [consents, setConsents] = useState<ConsentItem[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listMyConsents({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setConsents(items);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "No fue posible cargar tus autorizaciones.");
        setConsents([]);
      });
    return () => controller.abort();
  }, []);

  // La aceptación más reciente de cada documento (la lista llega de la más nueva a la más vieja).
  const latest = (document: LegalDocument) => consents?.find((item) => item.document === document) ?? null;
  const pending = profile.pending_consents ?? [];

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadMessage(null);
    const result = await downloadMyData();
    setIsDownloading(false);
    setDownloadMessage(
      result.ok ? { tone: "ok", text: "Descargamos el archivo «mis-datos-planati.json»." } : { tone: "error", text: result.message },
    );
  };

  return (
    <section id="privacidad" className={`scroll-mt-24 space-y-6 rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] sm:p-8 ${className}`}>
      <h2 className="flex items-center gap-3 text-xl font-extrabold">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef0ff] text-[#514ddd]">
          <Lock aria-hidden="true" className="size-5" />
        </span>
        Privacidad y datos
      </h2>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#26344d]">Autorizaciones</h3>
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {DOCUMENTS.map((document) => {
            const item = latest(document);
            const isPending = pending.includes(document);
            return (
              <li key={document} className="space-y-1 rounded-2xl bg-[#f3f5ff] px-4 py-3 text-sm">
                <Link
                  href={LEGAL_DOCUMENT_HREF[document]}
                  className="flex items-center gap-1.5 font-semibold text-[#17243d] hover:text-[#514ddd]"
                >
                  {LEGAL_DOCUMENT_LABEL[document]}
                  <ExternalLink aria-hidden="true" className="size-3.5 opacity-60" />
                </Link>
                {consents === null ? (
                  <span className="block h-4 w-40 animate-pulse rounded bg-[#e2e5ff]" />
                ) : item ? (
                  <p className="text-xs text-[#43506a]">
                    Versión {item.version} · aceptada el {formatDate(item.accepted_at)}
                    <span className="block text-[#6d6e7a]">{CONSENT_CHANNEL_LABEL[item.channel] ?? item.channel}</span>
                  </p>
                ) : (
                  <p className="text-xs text-[#6d6e7a]">Sin aceptación registrada.</p>
                )}
                {isPending && <p className="text-xs font-semibold text-[#a30f35]">Hay una versión nueva por aceptar.</p>}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-[#6d6e7a]">
          Puedes consultar también las <Link href="/legal/community-guidelines" className="font-semibold text-[#514ddd] hover:underline">Normas de la comunidad</Link>.
        </p>
      </div>

      <div className="space-y-3 border-t border-[#eef0f8] pt-5">
        <h3 className="text-sm font-bold text-[#26344d]">Descargar mis datos</h3>
        <p className="text-sm text-[#43506a]">
          Un archivo JSON con tu perfil, tus autorizaciones, reseñas, planes, favoritos, reportes y las notificaciones de los
          últimos 90 días. Puedes pedir una copia cada hora.
        </p>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#eef0ff] px-5 text-sm font-bold text-[#514ddd] hover:bg-[#e2e5ff] disabled:opacity-60"
        >
          {isDownloading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
          Descargar mis datos
        </button>
        {downloadMessage && (
          <p role="status" className={`text-xs font-medium ${downloadMessage.tone === "ok" ? "text-[#0b6b5c]" : "text-[#a30f35]"}`}>
            {downloadMessage.text}
          </p>
        )}
      </div>

      <div className="space-y-3 border-t border-[#eef0f8] pt-5">
        <h3 className="text-sm font-bold text-[#a30f35]">Eliminar mi cuenta</h3>
        <p className="text-sm text-[#43506a]">
          Borra tus reseñas, planes, favoritos, notificaciones y tus datos personales. No se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-[#f3c3cc] px-5 text-sm font-bold text-[#a30f35] hover:bg-[#fff1f3]"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Eliminar mi cuenta
        </button>
      </div>

      {deleting && <DeleteAccountDialog user={profile} onClose={() => setDeleting(false)} />}
    </section>
  );
}
