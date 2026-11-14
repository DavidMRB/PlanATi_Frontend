"use client";

import { APILoadingStatus, APIProvider, useApiLoadingStatus } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";
import { hasMapsApiKey, mapsConfig } from "@/lib/maps-config";
import MapUnavailable from "./MapUnavailable";

type MapsProviderProps = {
  children: ReactNode;
  // Qué mostrar sin clave o si Google Maps no carga (por defecto, MapUnavailable).
  fallback?: (reason: "missing-key" | "load-error") => ReactNode;
};

function LoadGuard({ children, fallback }: MapsProviderProps) {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    // AUTH_FAILURE: clave inválida o restringida a otro dominio.
    return <>{fallback ? fallback("load-error") : <MapUnavailable reason="load-error" className="size-full" />}</>;
  }
  return <>{children}</>;
}

// Carga la API de Google Maps solo en las vistas que tienen mapa (no en el layout raíz), en español y
// con región Colombia. Todas las vistas usan las mismas opciones: el script se carga una sola vez.
export default function MapsProvider({ children, fallback }: MapsProviderProps) {
  if (!hasMapsApiKey) {
    return <>{fallback ? fallback("missing-key") : <MapUnavailable className="size-full" />}</>;
  }
  return (
    <APIProvider apiKey={mapsConfig.apiKey} language={mapsConfig.language} region={mapsConfig.region}>
      <LoadGuard fallback={fallback}>{children}</LoadGuard>
    </APIProvider>
  );
}
