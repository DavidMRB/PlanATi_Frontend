"use client";

import { Trophy } from "lucide-react";
import { formatRating } from "@/lib/establishments-api";
import type { RatingDistribution } from "@/lib/reviews-api";
import StarRating from "./StarRating";

type RatingSummaryProps = {
  average: number | null;
  count: number;
  distribution: RatingDistribution;
  categoryRank?: number | null;
  category?: string;
  // Estrellas elegidas para filtrar la lista (clic en una barra); null = todas.
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void;
  variant?: "default" | "restaurant";
};

// Promedio, total, barras 5→1 (clic filtra la lista) y "#N en {categoría}".
export default function RatingSummary({
  average,
  count,
  distribution,
  categoryRank,
  category,
  selectedRating = null,
  onSelectRating,
  variant = "default",
}: RatingSummaryProps) {
  const formatted = formatRating(average);
  const restaurantPanel = variant === "restaurant";

  return (
    <div className={`grid rounded-2xl bg-white shadow-[0_4px_16px_rgba(23,36,61,0.06)] sm:grid-cols-[auto_1fr] sm:items-center ${restaurantPanel ? "gap-4 p-4 sm:gap-6 sm:p-5" : "gap-6 p-5"}`}>
      <div className="flex flex-col items-center gap-1.5 text-center sm:px-4">
        <p className="text-5xl font-extrabold tracking-tight">{formatted ?? "—"}</p>
        <StarRating value={average ?? 0} />
        <p className="text-xs text-[#6d6e7a]">
          {count === 0 ? "Sin reseñas todavía" : `${count} ${count === 1 ? "reseña" : "reseñas"}`}
        </p>
        {categoryRank && category && (
          <p className="mt-1 flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1 text-xs font-bold text-[#8a5a00]">
            <Trophy aria-hidden="true" className="size-3.5" />#{categoryRank} en {category}
          </p>
        )}
      </div>

      <div className="space-y-2">
      {restaurantPanel && <p className="text-xs font-bold text-[#43506a]">Desglose de calificaciones</p>}
      <ul className="space-y-1.5" aria-label="Distribución de calificaciones">
        {[5, 4, 3, 2, 1].map((star) => {
          const amount = distribution[String(star)] ?? 0;
          const percent = count > 0 ? Math.round((amount / count) * 100) : 0;
          const active = selectedRating === star;
          const content = (
            <>
              <span className="w-10 shrink-0 text-xs font-semibold text-[#43506a]">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef0ff]">
                <span className={`block h-full rounded-full ${restaurantPanel ? "bg-[#514ddd]" : "bg-[#d6154a]"}`} style={{ width: `${percent}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-xs text-[#6d6e7a]">{amount}</span>
            </>
          );
          return (
            <li key={star}>
              {onSelectRating && amount > 0 ? (
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${amount} reseñas de ${star} estrellas${active ? " (filtro activo)" : ""}`}
                  onClick={() => onSelectRating(active ? null : star)}
                  className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-0.5 transition hover:bg-[#f3f5ff] ${
                    active ? "bg-[#eef0ff] ring-1 ring-[#514ddd]" : ""
                  }`}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-1.5 py-0.5">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
