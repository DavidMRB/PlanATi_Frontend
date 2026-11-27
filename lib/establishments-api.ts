import { bogotaParts } from "./datetime";
import { authEndpoint, getAuthRequest } from "./auth-api";
import { boundsToQuery, type Bounds } from "./geo";
import type { MyReview, RatingDistribution, Review, ReviewBlockReason } from "./reviews-api";
import type { EstablishmentImage, MenuItem } from "./restaurant-api";

// Horario semanal: day_of_week 0 = lunes ... 6 = domingo; las horas llegan como "HH:MM:SS".
export type EstablishmentSchedule = {
  id: number;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
};

// Tipos de establecimiento del backend (app/schemas/geo.py) con su etiqueta pública.
export const ESTABLISHMENT_TYPES = {
  RESTAURANT: "Restaurante",
  CAFE: "Café",
  BAR: "Bar",
  HOTEL: "Hotel",
  EXPERIENCE: "Experiencia",
  STORE: "Tienda",
  OTHER: "Otro",
} as const;
export type EstablishmentType = keyof typeof ESTABLISHMENT_TYPES;

// Ayuda bajo el selector del registro y del perfil.
export const ESTABLISHMENT_TYPE_HINT: Record<EstablishmentType, string> = {
  RESTAURANT: "Comida servida en el local",
  CAFE: "Cafetería, panadería o postres",
  BAR: "Bebidas, música y vida nocturna",
  HOTEL: "Hospedaje",
  EXPERIENCE: "Tours, talleres, eventos u ocio",
  STORE: "Venta de productos",
  OTHER: "Otro tipo de lugar",
};

export const ESTABLISHMENT_TYPE_KEYS = Object.keys(ESTABLISHMENT_TYPES) as EstablishmentType[];

export function isEstablishmentType(value: unknown): value is EstablishmentType {
  return typeof value === "string" && value in ESTABLISHMENT_TYPES;
}

// Etiqueta pública del tipo, o null si el backend envía uno que el frontend no conoce.
export function establishmentTypeLabel(value: string | null | undefined): string | null {
  return isEstablishmentType(value) ? ESTABLISHMENT_TYPES[value] : null;
}

// Cómo se fijó la ubicación del local.
export type LocationSource = "GPS" | "ADDRESS" | "MAP_PIN" | "MANUAL";

// Elemento del directorio y de cercanos (B2): sin reseñas; la puntuación llega agregada.
export type PublicEstablishment = {
  id: number;
  owner_id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  price_range: string | null;
  status: string;
  phone: string | null;
  contact_email: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  manager_name: string | null;
  created_at: string;
  establishment_type: EstablishmentType | (string & {});
  city: string | null;
  location_source: LocationSource | null;
  google_place_id: string | null;
  rating_avg: number | null;
  rating_count: number;
  ranking_score: number | null;
  schedules?: EstablishmentSchedule[];
  // La página de inicio arma "experiencias" con los combos del listado.
  menu_items?: MenuItem[];
  images?: EstablishmentImage[];
};

export type NearbyEstablishment = PublicEstablishment & { distance_km: number };

// Detalle público (B3): ya no trae todas las reseñas; las 3 más recientes van en `recent_reviews` y el
// resto en GET /reviews/establishments/{id}. Los campos `viewer_*` dependen de quién consulta.
export type PublicEstablishmentDetail = PublicEstablishment & {
  gallery_images: EstablishmentImage[];
  menu_images: EstablishmentImage[];
  products: MenuItem[];
  combos: MenuItem[];
  reviews_count: number;
  average_rating: number | null;
  rating_distribution: RatingDistribution;
  // Puesto entre los aprobados de la misma categoría (1 = el mejor).
  category_rank: number | null;
  recent_reviews: Review[];
  viewer_review: MyReview | null;
  viewer_can_review: boolean;
  viewer_review_block: ReviewBlockReason | null;
  // B7: si el lugar está en los favoritos de quien consulta (false sin sesión).
  is_favorite: boolean;
};

export type MapMarker = {
  id: number;
  name: string;
  category: string;
  establishment_type: EstablishmentType | (string & {});
  latitude: string;
  longitude: string;
  rating_avg: number | null;
  rating_count: number;
  price_range: string | null;
  profile_image_url: string | null;
};

export type MapMarkersResponse = {
  items: MapMarker[];
  // Había más locales en el área que el límite: llegaron los mejor posicionados.
  truncated: boolean;
};

export type DirectorySort = "ranking" | "rating" | "reviews" | "recent" | "name";
export type NearbySort = "distance" | "rating" | "relevance";

// Sugerencias de categoría; el backend acepta cualquier texto de hasta 80 caracteres.
export const ESTABLISHMENT_CATEGORIES = [
  "Restaurante",
  "Cafetería",
  "Panadería",
  "Comida rápida",
  "Bar",
  "Pizzería",
  "Heladería",
] as const;

export type EstablishmentFilters = {
  category?: string;
  establishmentType?: string;
  minRating?: number;
};

const base = authEndpoint("/establishments");

function applyFilters(query: URLSearchParams, filters: EstablishmentFilters) {
  if (filters.category) query.set("category", filters.category);
  if (filters.establishmentType) query.set("establishment_type", filters.establishmentType);
  if (filters.minRating) query.set("min_rating", String(filters.minRating));
}

export function searchEstablishments(
  params: EstablishmentFilters & { search?: string; sort?: DirectorySort; skip?: number; limit?: number } = {},
  options: RequestInit = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  applyFilters(query, params);
  if (params.sort) query.set("sort", params.sort);
  if (params.skip) query.set("skip", String(params.skip));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return getAuthRequest<PublicEstablishment[]>(`${base}${serialized ? `?${serialized}` : ""}`, options);
}

export function getEstablishmentDetail(establishmentId: number) {
  return getAuthRequest<PublicEstablishmentDetail>(`${base}/${establishmentId}`);
}

// La ubicación del usuario solo viaja en esta consulta; el backend no la guarda.
export function searchNearbyEstablishments(
  params: EstablishmentFilters & {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    sort?: NearbySort;
  },
  options: RequestInit = {},
) {
  const query = new URLSearchParams({
    latitude: params.latitude.toFixed(6),
    longitude: params.longitude.toFixed(6),
  });
  if (params.radiusKm) query.set("radius_km", String(params.radiusKm));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  applyFilters(query, params);
  return getAuthRequest<NearbyEstablishment[]>(`${base}/nearby?${query.toString()}`, options);
}

// Marcadores del área visible del mapa (como máximo 500; mejor posicionados primero).
export function getMapMarkers(bounds: Bounds, filters: EstablishmentFilters = {}, signal?: AbortSignal) {
  const query = boundsToQuery(bounds);
  applyFilters(query, filters);
  return getAuthRequest<MapMarkersResponse>(`${base}/map?${query.toString()}`, { signal });
}

// "4,6" con una cifra decimal, o null si aún no hay reseñas.
export function formatRating(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return value.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function openStatus(schedules: Omit<EstablishmentSchedule, "id">[]) {
  if (!schedules.length) return null;
  const { weekday, hour, minute } = bogotaParts();
  const now = hour * 60 + minute;
  const previousDay = (weekday + 6) % 7;
  for (const interval of schedules) {
    const [openHour, openMinute] = interval.opening_time.split(":").map(Number);
    const [closeHour, closeMinute] = interval.closing_time.split(":").map(Number);
    const start = openHour * 60 + openMinute;
    const end = closeHour * 60 + closeMinute;
    const overnight = end < start;
    const sameDay = interval.day_of_week === weekday && now >= start && (overnight || now < end);
    const fromYesterday = overnight && interval.day_of_week === previousDay && now < end;
    if (sameDay || fromYesterday) return { open: true, closesAt: interval.closing_time.slice(0, 5) };
  }
  return { open: false, closesAt: null };
}
