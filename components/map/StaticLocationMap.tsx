"use client";

import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { mapsConfig } from "@/lib/maps-config";
import MapsProvider from "./MapsProvider";
import MapUnavailable from "./MapUnavailable";
import MarkerBubble from "./MarkerBubble";

export type StaticLocationMapProps = {
  latitude: number;
  longitude: number;
  name: string;
  establishmentType?: string | null;
  className?: string;
};

// Mapa pequeño de un solo punto (detalle, plan, admin): sin gestos ni controles, solo para ubicar.
// Los botones "Cómo llegar" y "Abrir en Google Maps" van fuera (no dependen de la clave).
export default function StaticLocationMap({ latitude, longitude, name, establishmentType, className = "h-48" }: StaticLocationMapProps) {
  const position = { lat: latitude, lng: longitude };
  return (
    <div role="img" aria-label={`Mapa con la ubicación de ${name}`} className={`overflow-hidden rounded-2xl ${className}`}>
      <MapsProvider fallback={(reason) => <MapUnavailable reason={reason} compact className="size-full" />}>
        <Map
          mapId={mapsConfig.mapId}
          defaultCenter={position}
          defaultZoom={16}
          gestureHandling="none"
          disableDefaultUI
          clickableIcons={false}
          keyboardShortcuts={false}
          className="size-full"
        >
          <AdvancedMarker position={position} title={name} clickable={false}>
            <MarkerBubble type={establishmentType} label={name} active />
          </AdvancedMarker>
        </Map>
      </MapsProvider>
    </div>
  );
}
