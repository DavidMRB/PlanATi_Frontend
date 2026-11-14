// Utilidades de geolocalización que no dependen de Google Maps.

export type LatLng = { lat: number; lng: number };

// Mismo orden que SERVICE_AREA_BOUNDS del backend: sur, oeste, norte, este.
export type Bounds = { south: number; west: number; north: number; east: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

// Distancia en línea recta (km). Sirve para mostrar distancias en el cliente; el orden por cercanía
// lo calcula el backend.
export function haversineKm(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

const kmFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const wholeKmFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

// "850 m", "2,3 km", "14 km".
export function formatDistance(km: number | string | null | undefined): string {
  const value = Number(km);
  if (km === null || km === undefined || km === "" || !Number.isFinite(value) || value < 0) return "";
  const meters = Math.max(10, Math.round((value * 1000) / 10) * 10);
  if (meters < 1000) return `${meters} m`;
  return `${(value < 10 ? kmFormatter : wholeKmFormatter).format(value)} km`;
}

// Acepta "7.8891,-72.4967" (o con espacios). Devuelve null si no es un punto válido.
export function parseLatLng(raw: string | null | undefined): LatLng | null {
  if (!raw) return null;
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// "sur,oeste,norte,este" → Bounds, o null si el texto no describe un área válida.
export function parseBounds(raw: string | null | undefined): Bounds | null {
  if (!raw) return null;
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;
  const [south, west, north, east] = parts;
  if (south >= north || west >= east) return null;
  return { south, west, north, east };
}

// Convierte coordenadas que llegan como texto (la API usa Decimal) a un punto, o null.
export function toLatLng(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined,
): LatLng | null {
  if (latitude === null || latitude === undefined || latitude === "") return null;
  if (longitude === null || longitude === undefined || longitude === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function isInsideServiceArea(point: LatLng, area: Bounds | null): boolean {
  if (!area) return true;
  return (
    point.lat >= area.south && point.lat <= area.north && point.lng >= area.west && point.lng <= area.east
  );
}

// Parámetros de GET /establishments/map (north, south, east, west).
export function boundsToQuery(bounds: Bounds): URLSearchParams {
  const round = (value: number) => value.toFixed(6);
  return new URLSearchParams({
    north: round(bounds.north),
    south: round(bounds.south),
    east: round(bounds.east),
    west: round(bounds.west),
  });
}

// Enlace "Cómo llegar" de Google Maps (no necesita la clave de la API).
export function directionsUrl(lat: number, lng: number, placeId?: string | null): string {
  const params = new URLSearchParams({ api: "1", destination: `${lat},${lng}` });
  if (placeId) params.set("destination_place_id", placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Enlace "Abrir en Google Maps" para un punto.
export function mapsSearchUrl(lat: number, lng: number, placeId?: string | null): string {
  const params = new URLSearchParams({ api: "1", query: `${lat},${lng}` });
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
