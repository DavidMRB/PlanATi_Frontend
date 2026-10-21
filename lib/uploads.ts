import { authEndpoint, postAuthRequest } from "./auth-api";
import { createUploadUrl, type UploadFolder, type UploadUrl } from "./restaurant-api";

// "avatars" es la foto de perfil del usuario: usa su propio endpoint porque no exige rol de restaurante.
export type ImageFolder = UploadFolder | "avatars";

function createAvatarUploadUrl(fileExtension: string) {
  const query = new URLSearchParams({ file_extension: fileExtension });
  return postAuthRequest<undefined, UploadUrl>(authEndpoint(`/users/me/upload-url?${query}`), undefined);
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

// Sube el archivo directo a R2 con una URL prefirmada y devuelve la URL pública.
// Requiere sesión; las carpetas de restaurante además exigen rol restaurante.
export async function uploadImage(
  folder: ImageFolder,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const extension = ACCEPTED_TYPES[file.type];
  if (!extension) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  const upload = folder === "avatars" ? await createAvatarUploadUrl(extension) : await createUploadUrl(folder, extension);
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
