"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";
import { RATING_LABELS } from "@/lib/reviews-api";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  error?: string | null;
};

// Grupo de radios accesible (1–5): flechas del teclado, vista previa al pasar el cursor y etiqueta.
export default function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold text-[#26344d]">Tu calificación *</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} onMouseEnter={() => setHover(star)} className="cursor-pointer p-0.5">
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="peer sr-only"
              />
              <span className="sr-only">
                {star} {star === 1 ? "estrella" : "estrellas"}: {RATING_LABELS[star]}
              </span>
              <Star
                aria-hidden="true"
                className={`size-8 rounded transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#514ddd] ${
                  star <= shown ? "fill-[#d6154a] text-[#d6154a]" : "text-[#c9cdf4]"
                }`}
              />
            </label>
          ))}
        </div>
        <span aria-live="polite" className="text-sm font-semibold text-[#43506a]">
          {shown ? RATING_LABELS[shown] : "Elige de 1 a 5 estrellas"}
        </span>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  );
}
