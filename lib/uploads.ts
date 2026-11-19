import { authEndpoint, postAuthRequest } from "./auth-api";
import { createUploadUrl, type UploadFolder, type UploadUrl } from "./restaurant-api";

// "avatars" es la foto de perfil del usuario y "reviews" las fotos de una reseña: usan sus propios
// endpoints porque no exigen rol de restaurante.
export type ImageFolder = UploadFolder | "avatars" | "reviews";

const OWN_UPLOAD_ENDPOINTS = {
  avatars: "/users/me/upload-url",
  reviews: "/reviews/upload-url",
} as const;

function createOwnUploadUrl(folder: keyof typeof OWN_UPLOAD_ENDPOINTS, fileExtension: string) {
  const query = new URLSearchParams({ file_extension: fileExtension });
  return postAuthRequest<undefined, UploadUrl>(authEndpoint(`${OWN_UPLOAD_ENDPOINTS[folder]}?${query}`), undefined);
}

// El backend espera la extensión con punto (".png") y valida contra esta lista.
const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

// Devuelve un mensaje de error si el archivo no sirve, o null si es válido.
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES[file.type]) {
    return "Formato no permitido. Usa JPG, PNG o WEBP.";
  }
  if (file.size > MAX_BYTES) {
    return "La imagen supera el tamaño máximo de 5 MB.";
  }
  return null;
}

// Pide la URL prefirmada de una carpeta de establecimiento. Por defecto, la del propio restaurante
// (/restaurant/upload-url); el admin pasa la de /admin/establishments/{id}/upload-url.
export type UploadUrlFactory = (folder: UploadFolder, fileExtension: string) => Promise<UploadUrl | undefined>;

// Sube el archivo directo a R2 con una URL prefirmada y devuelve la URL pública.
// Requiere sesión; las carpetas de restaurante además exigen rol restaurante (o admin con `createUrl`).
export async function uploadImage(
  folder: ImageFolder,
  file: File,
  onProgress?: (percent: number) => void,
  createUrl: UploadUrlFactory = createUploadUrl,
): Promise<string> {
  const extension = ACCEPTED_TYPES[file.type];
  if (!extension) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  const upload =
    folder === "avatars" || folder === "reviews"
      ? await createOwnUploadUrl(folder, extension)
      : await createUrl(folder, extension);
  if (!upload) {
    throw new Error("No se recibió la URL de subida.");
  }

  // XHR (y no fetch) para poder reportar el progreso de la subida.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", upload.upload_url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("No se pudo subir la imagen."));
    xhr.onerror = () => reject(new Error("Error de red al subir la imagen."));
    xhr.send(file);
  });

  return upload.public_url;
}
