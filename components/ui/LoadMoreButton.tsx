"use client";

import { Loader2 } from "lucide-react";

type LoadMoreButtonProps = {
  // Elementos ya cargados y total que informa la API (`Page<T>.total`).
  loaded: number;
  total?: number;
  // Para listas sin total (p. ej. el directorio): si la última página llegó completa.
  hasMore?: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  label?: string;
};

// Paginación "Cargar más". No se muestra cuando ya se cargó todo.
export default function LoadMoreButton({
  loaded,
  total,
  hasMore,
  isLoading,
  onLoadMore,
  label = "Cargar más",
}: LoadMoreButtonProps) {
  const more = hasMore ?? (total !== undefined && loaded < total);
  if (!more) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="flex h-11 items-center gap-2 rounded-xl border border-[#d7dcf2] bg-white px-5 text-sm font-semibold text-[#514ddd] transition hover:bg-[#f3f5ff] disabled:opacity-60"
      >
        {isLoading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isLoading ? "Cargando..." : label}
      </button>
      {total !== undefined && (
        <p className="text-xs text-[#6d6e7a]">
          Mostrando {loaded} de {total}
        </p>
      )}
    </div>
  );
}
