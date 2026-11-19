"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { IMAGE_ACCEPT, uploadImage, validateImageFile, type ImageFolder, type UploadUrlFactory } from "@/lib/uploads";

type ImageUploadFieldProps = {
  label: string;
  folder: ImageFolder;
  value: string | null;
  onChange: (publicUrl: string | null) => void;
  heightClass?: string;
  circle?: boolean;
  // Quién firma la subida (el admin gestionando un local usa la suya).
  createUploadUrl?: UploadUrlFactory;
};

export default function ImageUploadField({
  label,
  folder,
  value,
  onChange,
  heightClass = "h-40",
  circle = false,
  createUploadUrl,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isUploading = progress !== null;
  const shownImage = previewUrl ?? value;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setProgress(0);

    try {
      const publicUrl = await uploadImage(folder, file, setProgress, createUploadUrl);
      setPreviewUrl(null);
      onChange(publicUrl);
    } catch (uploadError) {
      // Se conserva la imagen anterior si la nueva no se pudo subir.
      setPreviewUrl(null);
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible subir la imagen.");
    } finally {
      setProgress(null);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError("");
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-[#26344d]">{label}</span>
      <div
        className={`relative flex items-center justify-center overflow-hidden border-2 border-dashed border-[#c9cdf4] bg-[#eef2ff] ${
          circle ? "size-32 rounded-full" : `${heightClass} rounded-xl`
        }`}
      >
        {shownImage ? (
          // Sin Referer: lh3.googleusercontent.com responde 429 a las fotos de Google cuando llega con Referer.
          // eslint-disable-next-line @next/next/no-img-element -- URLs de R2, Google y blob: sin optimizar
          <img src={shownImage} alt={label} referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <ImagePlus aria-hidden="true" className="size-8 text-[#81869a]" />
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80">
            <Loader2 aria-hidden="true" className="size-6 animate-spin text-[#4c4cdd]" />
            <div className="h-2 w-3/4 overflow-hidden rounded-full bg-[#e4e6f0]">
              <div className="h-full bg-[#4c4cdd] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#4c4cdd] shadow-sm ring-1 ring-[#c9cdf4] hover:bg-[#f8f8ff]">
          {shownImage ? "Cambiar imagen" : "Seleccionar imagen"}
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => void handleFileChange(event)}
          />
        </label>
        {shownImage && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-xs font-semibold text-[#6d6e7a] hover:text-red-600"
          >
            <X aria-hidden="true" className="size-3.5" />
            Quitar
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
