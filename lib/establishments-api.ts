import { authEndpoint, getAuthRequest } from "./auth-api";
import type { EstablishmentImage, MenuItem } from "./restaurant-api";

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
};

export type PublicEstablishmentDetail = PublicEstablishment & {
  gallery_images: EstablishmentImage[];
  menu_images: EstablishmentImage[];
  products: MenuItem[];
  combos: MenuItem[];
  reviews_count: number;
  average_rating: number | null;
};

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

const base = authEndpoint("/establishments");

export function searchEstablishments(params: { search?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  const serialized = query.toString();
  const suffix = serialized ? `?${serialized}` : "";
  return getAuthRequest<PublicEstablishment[]>(`${base}${suffix}`);
}

export function getEstablishmentDetail(establishmentId: number) {
  return getAuthRequest<PublicEstablishmentDetail>(`${base}/${establishmentId}`);
}
