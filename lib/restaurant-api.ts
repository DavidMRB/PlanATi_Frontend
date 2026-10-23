import {
  authEndpoint,
  deleteAuthRequest,
  getAuthRequest,
  patchAuthRequest,
  postAuthRequest,
} from "./auth-api";

export type EstablishmentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ImageType = "GALLERY" | "MENU";
// Valores aceptados por el backend en /restaurant/upload-url (enum `folder`).
export type UploadFolder = "establishments" | "menu" | "products";

export type RestaurantRegisterPayload = {
  account_email: string;
  password: string;
  manager_name: string;
  establishment_name: string;
  category: string;
  address: string;
  establishment_phone: string;
  contact_email: string;
  description: string;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
};

export type RestaurantRegisterResponse = {
  user_id: number;
  establishment_id: number;
  role: string;
  establishment_status: EstablishmentStatus;
  message: string;
};

export type RestaurantStatus = {
  establishment_id: number;
  name: string;
  category: string;
  address: string;
  status: EstablishmentStatus;
  rejection_reason: string | null;
};

export type RestaurantProfileUpdate = {
  name?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  contact_email?: string | null;
  description?: string | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  manager_name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  price_range?: string | null;
};

export type RestaurantProfile = {
  id: number;
  owner_id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  price_range: string | null;
  status: EstablishmentStatus;
  phone: string | null;
  contact_email: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  manager_name: string | null;
  created_at: string;
};

export type UploadUrl = {
  upload_url: string;
  public_url: string;
  key: string;
};

export type EstablishmentImage = {
  id: number;
  image_url: string;
  image_type: ImageType;
  caption: string | null;
  display_order: number;
};

export type ComboItem = {
  product_id: number;
  quantity: number;
  product_name: string | null;
};

// Productos y combos comparten el mismo modelo: `is_combo` los distingue.
export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_combo: boolean;
  is_available: boolean;
  combo_items: ComboItem[];
};

export type ProductPayload = {
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  is_available?: boolean;
};

export type ComboPayload = ProductPayload & {
  items: Array<{ product_id: number; quantity: number }>;
};

const base = authEndpoint("/restaurant");

export function registerRestaurant(payload: RestaurantRegisterPayload) {
  return postAuthRequest<RestaurantRegisterPayload, RestaurantRegisterResponse>(
    authEndpoint("/auth/restaurant/register"),
    payload,
  );
}

export function getRestaurantStatus() {
  return getAuthRequest<RestaurantStatus>(`${base}/status`);
}

export function reapplyRestaurant(payload: RestaurantProfileUpdate) {
  return patchAuthRequest<RestaurantProfileUpdate, { status: EstablishmentStatus; message: string }>(
    `${base}/reapply`,
    payload,
  );
}

export function getRestaurantProfile() {
  return getAuthRequest<RestaurantProfile>(`${base}/profile`);
}

export function updateRestaurantProfile(payload: RestaurantProfileUpdate) {
  return patchAuthRequest<RestaurantProfileUpdate, RestaurantProfile>(`${base}/profile`, payload);
}

// fileExtension incluye el punto, por ejemplo ".png".
export function createUploadUrl(folder: UploadFolder, fileExtension: string) {
  const query = new URLSearchParams({ folder, file_extension: fileExtension });
  return postAuthRequest<undefined, UploadUrl>(`${base}/upload-url?${query}`, undefined);
}

export function listRestaurantImages(imageType?: ImageType) {
  const query = imageType ? `?image_type=${imageType}` : "";
  return getAuthRequest<EstablishmentImage[]>(`${base}/images${query}`);
}

export function createRestaurantImage(payload: {
  image_url: string;
  image_type: ImageType;
  caption?: string | null;
  display_order?: number;
}) {
  return postAuthRequest<typeof payload, EstablishmentImage>(`${base}/images`, payload);
}

export function deleteRestaurantImage(imageId: number) {
  return deleteAuthRequest(`${base}/images/${imageId}`);
}

export function listProducts() {
  return getAuthRequest<MenuItem[]>(`${base}/products`);
}

export function createProduct(payload: ProductPayload) {
  return postAuthRequest<ProductPayload, MenuItem>(`${base}/products`, payload);
}

export function updateProduct(productId: number, payload: Partial<ProductPayload>) {
  return patchAuthRequest<Partial<ProductPayload>, MenuItem>(
    `${base}/products/${productId}`,
    payload,
  );
}

export function deleteProduct(productId: number) {
  return deleteAuthRequest(`${base}/products/${productId}`);
}

export function createCombo(payload: ComboPayload) {
  return postAuthRequest<ComboPayload, MenuItem>(`${base}/combos`, payload);
}

export function updateCombo(comboId: number, payload: Partial<ComboPayload>) {
  return patchAuthRequest<Partial<ComboPayload>, MenuItem>(`${base}/combos/${comboId}`, payload);
}

export function deleteCombo(comboId: number) {
  return deleteAuthRequest(`${base}/combos/${comboId}`);
}
