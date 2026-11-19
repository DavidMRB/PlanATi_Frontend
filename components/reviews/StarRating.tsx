import { Star } from "lucide-react";

type StarRatingProps = {
  // Admite decimales (promedios): se dibujan medias estrellas.
  value: number;
  className?: string;
  starClassName?: string;
};

// Estrellas de solo lectura, con texto accesible "4,5 de 5 estrellas".
export default function StarRating({ value, className = "", starClassName = "size-4" }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2;
  const label = `${rounded.toLocaleString("es-CO")} de 5 estrellas`;
  return (
    <span role="img" aria-label={label} className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((position) => {
        const fill = rounded >= position ? 1 : rounded >= position - 0.5 ? 0.5 : 0;
        return (
          <span key={position} aria-hidden="true" className={`relative inline-block ${starClassName}`}>
            <Star className={`absolute inset-0 size-full text-[#d7dcf2]`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? "100%" : "50%" }}>
                <Star className={`${starClassName} fill-[#d6154a] text-[#d6154a]`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
