import { authEndpoint, deleteAuthRequest, getAuthRequest, patchAuthRequest, postAuthRequest, putAuthRequest } from "./auth-api";
import type { EstablishmentSchedule } from "./establishments-api";
import {
  createCombo,
  createProduct,
  createRestaurantImage,
  createUploadUrl,
  deleteCombo,
  deleteProduct,
  deleteRestaurantImage,
  getRestaurantProfile,
  getSchedules,
  listProducts,
  listRestaurantImages,
  putSchedules,
  updateCombo,
  updateProduct,
  updateRestaurantProfile,
  type ComboPayload,
  type EstablishmentImage,
  type ImageType,
  type MenuItem,
  type ProductPayload,
  type RestaurantProfile,
  type RestaurantProfileUpdate,
  type ScheduleInput,
  type UploadFolder,
  type UploadUrl,
} from "./restaurant-api";

export type NewImagePayload = { image_url: string; image_type: ImageType; caption?: string | null; display_order?: number };

// Gestión del perfil y el catálogo de un establecimiento. Las pantallas de components/establishment-management/
// la reciben por props: el panel del restaurante usa `restaurantManagementApi` (rutas /restaurant/*) y el admin
// `adminManagementApi(id)` (rutas /admin/establishments/{id}/*, que dejan bitácora y avisan al dueño).
export type EstablishmentManagementApi = {
  mode: "restaurant" | "admin";
  getProfile: () => Promise<RestaurantProfile | undefined>;
  updateProfile: (payload: RestaurantProfileUpdate) => Promise<RestaurantProfile | undefined>;
  listProducts: () => Promise<MenuItem[] | undefined>;
  createProduct: (payload: ProductPayload) => Promise<MenuItem | undefined>;
  updateProduct: (productId: number, payload: Partial<ProductPayload>) => Promise<MenuItem | undefined>;
  deleteProduct: (productId: number) => Promise<void>;
  createCombo: (payload: ComboPayload) => Promise<MenuItem | undefined>;
  updateCombo: (comboId: number, payload: Partial<ComboPayload>) => Promise<MenuItem | undefined>;
  deleteCombo: (comboId: number) => Promise<void>;
  listImages: (imageType?: ImageType) => Promise<EstablishmentImage[] | undefined>;
  createImage: (payload: NewImagePayload) => Promise<EstablishmentImage | undefined>;
  deleteImage: (imageId: number) => Promise<void>;
  getSchedules: () => Promise<EstablishmentSchedule[] | undefined>;
  putSchedules: (schedules: ScheduleInput[]) => Promise<EstablishmentSchedule[] | undefined>;
  createUploadUrl: (folder: UploadFolder, fileExtension: string) => Promise<UploadUrl | undefined>;
};

export const restaurantManagementApi: EstablishmentManagementApi = {
  mode: "restaurant",
  getProfile: getRestaurantProfile,
  updateProfile: updateRestaurantProfile,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createCombo,
  updateCombo,
  deleteCombo,
  listImages: listRestaurantImages,
  createImage: createRestaurantImage,
  deleteImage: deleteRestaurantImage,
  getSchedules,
  putSchedules,
  createUploadUrl,
};

// `setReason` fija el motivo (opcional) que acompaña las ediciones del perfil: queda en la bitácora y se envía al
// dueño. El catálogo no lleva motivo; el backend registra cada cambio y avisa al dueño una vez al día.
export function adminManagementApi(establishmentId: number): EstablishmentManagementApi & { setReason: (reason: string) => void } {
  const base = authEndpoint(`/admin/establishments/${establishmentId}`);
  let reason: string | null = null;
  return {
    setReason: (value) => {
      reason = value.trim() || null;
    },
    mode: "admin",
    // El detalle del admin es un superconjunto del perfil del restaurante.
    getProfile: () => getAuthRequest<RestaurantProfile>(base),
    updateProfile: (payload) =>
      patchAuthRequest<RestaurantProfileUpdate & { reason: string | null }, RestaurantProfile>(base, { ...payload, reason }),
    listProducts: () => getAuthRequest<MenuItem[]>(`${base}/products`),
    createProduct: (payload) => postAuthRequest<ProductPayload, MenuItem>(`${base}/products`, payload),
    updateProduct: (productId, payload) => patchAuthRequest<Partial<ProductPayload>, MenuItem>(`${base}/products/${productId}`, payload),
    deleteProduct: (productId) => deleteAuthRequest(`${base}/products/${productId}`),
    createCombo: (payload) => postAuthRequest<ComboPayload, MenuItem>(`${base}/combos`, payload),
    updateCombo: (comboId, payload) => patchAuthRequest<Partial<ComboPayload>, MenuItem>(`${base}/combos/${comboId}`, payload),
    deleteCombo: (comboId) => deleteAuthRequest(`${base}/combos/${comboId}`),
    listImages: (imageType) => getAuthRequest<EstablishmentImage[]>(`${base}/images${imageType ? `?image_type=${imageType}` : ""}`),
    createImage: (payload) => postAuthRequest<NewImagePayload, EstablishmentImage>(`${base}/images`, payload),
    deleteImage: (imageId) => deleteAuthRequest(`${base}/images/${imageId}`),
    getSchedules: () => getAuthRequest<EstablishmentSchedule[]>(`${base}/schedules`),
    putSchedules: (schedules) => putAuthRequest<ScheduleInput[], EstablishmentSchedule[]>(`${base}/schedules`, schedules),
    createUploadUrl: (folder, fileExtension) => {
      const query = new URLSearchParams({ folder, file_extension: fileExtension });
      return postAuthRequest<undefined, UploadUrl>(`${base}/upload-url?${query}`, undefined);
    },
  };
}
