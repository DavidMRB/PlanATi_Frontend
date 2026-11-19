"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

type ImageLightboxProps = {
  images: Array<{ id: number; image_url: string }>;
  startIndex: number;
  title: string;
  onClose: () => void;
};

// Visor de imágenes (sobre Modal) con flechas del teclado.
export default function ImageLightbox({ images, startIndex, title, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % count);
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + count) % count);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [count]);

  const image = images[index];
  if (!image) return null;

  return (
    <Modal title={title} onClose={onClose} widthClass="max-w-3xl">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
        <img
          src={image.image_url}
          alt={`Foto ${index + 1} de ${count}`}
          className="max-h-[70vh] w-full rounded-xl bg-[#f1f2f6] object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <p className="mt-3 text-center text-xs text-[#6d6e7a]">
          {index + 1} de {count}
        </p>
      )}
    </Modal>
  );
}
