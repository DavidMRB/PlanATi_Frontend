"use client";

import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import Modal from "@/components/ui/Modal";
import { notifyUser } from "@/lib/admin-api";

// Aviso manual (ADMIN_MESSAGE) a una cuenta. El enlace es una ruta interna opcional, p. ej. "/profile".
export default function NotifyUserModal({
  userId,
  userName,
  onClose,
  onSent,
}: {
  userId: number;
  userName: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const linkValid = link.trim() === "" || /^\/[^\s]*$/.test(link.trim());
  const valid = title.trim().length >= 3 && body.trim().length >= 1 && linkValid;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await notifyUser(userId, { title: title.trim(), body: body.trim(), link: link.trim() || null });
      onSent();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible enviar el aviso.");
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-[#6868e8]/40";

  return (
    <Modal title={`Enviar aviso a ${userName}`} onClose={busy ? () => undefined : onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[#43506a]">Le llegará como notificación en la app. Queda registrado en la bitácora.</p>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-title`} className="text-sm font-semibold">
            Título
          </label>
          <input id={`${id}-title`} value={title} maxLength={150} onChange={(event) => setTitle(event.target.value)} className={input} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-body`} className="text-sm font-semibold">
            Mensaje
          </label>
          <textarea id={`${id}-body`} rows={4} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} className={input} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-link`} className="text-sm font-semibold">
            Enlace <span className="font-normal text-[#6d6e7a]">(opcional, ruta de la app)</span>
          </label>
          <input
            id={`${id}-link`}
            value={link}
            maxLength={300}
            placeholder="/profile"
            onChange={(event) => setLink(event.target.value)}
            aria-invalid={!linkValid}
            className={input}
          />
          {!linkValid && <p className="text-xs text-red-600">Debe empezar por “/” y no llevar espacios.</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!valid || busy}
          className="flex items-center gap-2 rounded-xl bg-[#514ddd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-50"
        >
          {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Enviar aviso
        </button>
      </div>
    </Modal>
  );
}
