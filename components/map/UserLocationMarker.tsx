"use client";

import { AdvancedMarker, Circle } from "@vis.gl/react-google-maps";
import type { GeoPosition } from "@/hooks/useGeolocation";

// Por encima de este radio el círculo cubre media ciudad y no aporta: solo se dibuja el punto.
const MAX_ACCURACY_CIRCLE_M = 1500;

// Punto azul de la ubicación del usuario con su círculo de precisión.
export default function UserLocationMarker({ position }: { position: GeoPosition }) {
  const center = { lat: position.lat, lng: position.lng };
  return (
    <>
      {position.accuracy > 0 && position.accuracy <= MAX_ACCURACY_CIRCLE_M && (
        <Circle
          center={center}
          radius={position.accuracy}
          clickable={false}
          strokeColor="#2563eb"
          strokeOpacity={0.35}
          strokeWeight={1}
          fillColor="#3b82f6"
          fillOpacity={0.12}
        />
      )}
      <AdvancedMarker position={center} title="Tu ubicación" zIndex={1100} anchorLeft="-50%" anchorTop="-50%" clickable={false}>
        <span className="block size-4 rounded-full border-2 border-white bg-[#2563eb] shadow-[0_0_0_6px_rgba(37,99,235,0.22)]" />
      </AdvancedMarker>
    </>
  );
}
