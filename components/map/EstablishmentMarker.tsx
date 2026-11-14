"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import { formatRating, type MapMarker } from "@/lib/establishments-api";
import MarkerBubble from "./MarkerBubble";

type EstablishmentMarkerProps = {
  marker: MapMarker;
  active: boolean;
  onSelect: (marker: MapMarker) => void;
  onHover?: (id: number | null) => void;
  // Registro para el agrupador de marcadores (MarkerClusterer).
  markerRef?: (element: google.maps.marker.AdvancedMarkerElement | null, id: number) => void;
};

// Marcador accesible: botón con título "Nombre, 4,6 estrellas (12 reseñas)".
export default function EstablishmentMarker({ marker, active, onSelect, onHover, markerRef }: EstablishmentMarkerProps) {
  // Referencia memorizada por id: si cambiara en cada render, React la desconectaría y volvería a
  // conectar, y el registro del agrupador de marcadores entraría en un ciclo.
  const ref = useCallback(
    (element: google.maps.marker.AdvancedMarkerElement | null) => markerRef?.(element, marker.id),
    [markerRef, marker.id],
  );
  const rating = formatRating(marker.rating_avg);
  const title = rating
    ? `${marker.name}, ${rating} estrellas (${marker.rating_count} ${marker.rating_count === 1 ? "reseña" : "reseñas"})`
    : `${marker.name}, sin reseñas`;

  return (
    <AdvancedMarker
      ref={markerRef ? ref : undefined}
      position={{ lat: Number(marker.latitude), lng: Number(marker.longitude) }}
      title={title}
      zIndex={active ? 1000 : undefined}
      onClick={() => onSelect(marker)}
      onMouseEnter={onHover ? () => onHover(marker.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      <MarkerBubble type={marker.establishment_type} rating={rating} active={active} />
    </AdvancedMarker>
  );
}
