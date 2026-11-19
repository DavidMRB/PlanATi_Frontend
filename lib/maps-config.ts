import { parseBounds, parseLatLng, type Bounds, type LatLng } from "./geo";

// Configuración de Google Maps y del mapa (sección 3.4 del plan de la fase 2).
// Las variables NEXT_PUBLIC_* se incrustan al hacer `next build`: cambiar .env.local exige reconstruir.
// Se leen con `process.env.NEXT_PUBLIC_…` literal porque Next.js no reemplaza las lecturas dinámicas.
// La clave es pública por diseño (va en el JavaScript del sitio); se protege con las restricciones de
// Google Cloud. Este módulo nunca la escribe en la consola ni la incluye en mensajes de error.

const CUCUTA: LatLng = { lat: 7.8891, lng: -72.4967 };
const DEFAULT_ZOOM = 13;
// Colombia; igual que SERVICE_AREA_BOUNDS por defecto en el backend.
const COLOMBIA: Bounds = { south: -4.3, west: -81.8, north: 13.6, east: -66.8 };

function parseZoom(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 21 ? value : DEFAULT_ZOOM;
}

const rawServiceArea = process.env.NEXT_PUBLIC_SERVICE_AREA_BOUNDS;

export const mapsConfig = {
  apiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim(),
  // DEMO_MAP_ID sirve para desarrollo; en producción, el Map ID creado en "Map Management".
  mapId: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "").trim() || "DEMO_MAP_ID",
  defaultCenter: parseLatLng(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER) ?? CUCUTA,
  defaultZoom: parseZoom(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM),
  // Vacío = sin restricción de área (como en el backend); inválido = Colombia.
  serviceArea: rawServiceArea !== undefined && rawServiceArea.trim() === "" ? null : (parseBounds(rawServiceArea) ?? COLOMBIA),
  language: "es",
  region: "CO",
} as const;

// Sin clave, los mapas muestran MapUnavailable y la app sigue funcionando (lista, GPS y enlaces externos).
export const hasMapsApiKey = mapsConfig.apiKey.length > 0;
