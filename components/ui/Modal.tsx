"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  titleIcon?: ReactNode;
  blurBackdrop?: boolean;
};

export default function Modal({ title, onClose, children, widthClass = "max-w-lg", titleIcon, blurBackdrop = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      role="dialog"
      ref={ref}
      aria-label={title}
      aria-modal="true"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}
      className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${widthClass} overscroll-contain overflow-y-auto rounded-2xl bg-white p-4 text-[#17243d] shadow-2xl backdrop:bg-[#17243d]/40 sm:p-6 ${blurBackdrop ? "backdrop:backdrop-blur-sm" : ""}`}
    >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#17243d]">{titleIcon}{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full text-[#81869a] hover:text-[#17243d]">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
    </dialog>
  );
}
