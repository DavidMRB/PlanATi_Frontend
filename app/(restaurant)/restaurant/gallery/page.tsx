"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import {
  createRestaurantImage,
  deleteRestaurantImage,
  listRestaurantImages,
  type EstablishmentImage,
  type ImageType,
  type UploadFolder,
} from "@/lib/restaurant-api";

const TABS: Array<{ value: ImageType; label: string; folder: UploadFolder; empty: string }> = [
  { value: "GALLERY", label: "Fotos del lugar", folder: "establishments", empty: "Aún no has subido fotos del lugar." },
  { value: "MENU", label: "Fotos del menú", folder: "menu", empty: "Aún no has subido fotos del menú físico." },
];

export default function RestaurantGalleryPage() {
  const [imageType, setImageType] = useState<ImageType>("GALLERY");
  const [reloadKey, setReloadKey] = useState(0);
  const [images, setImages] = useState<EstablishmentImage[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const tab = TABS.find((item) => item.value === imageType) ?? TABS[0];

  useEffect(() => {
    let cancelled = false;
    listRestaurantImages(imageType)
      .then((data) => {
        if (!cancelled) setImages(data ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las fotos.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [imageType, reloadKey]);

  const selectType = (value: ImageType) => {
    setImages(null);
    setImageType(value);
  };

  const handleUploaded = async (url: string | null) => {
    if (!url) return;
    setError("");
    setMessage("");
    try {
      const nextOrder = images?.length ?? 0;
      await createRestaurantImage({ image_url: url, image_type: imageType, display_order: nextOrder });
      setMessage("Foto agregada.");
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la foto.");
    }
  };

  const handleDelete = async (image: EstablishmentImage) => {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    setError("");
    setMessage("");
    try {
      await deleteRestaurantImage(image.id);
      setMessage("Foto eliminada.");
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar la foto.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Fotos</h1>
        <p className="text-sm text-[#6d6e7a]">Las fotos del lugar aparecen en tu ficha; las del menú muestran tu carta física.</p>
      </header>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={imageType === item.value}
            onClick={() => selectType(item.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              imageType === item.value ? "bg-[#4c4cdd] text-white" : "bg-white text-[#6d6e7a] ring-1 ring-[#e4e6f0] hover:text-[#4c4cdd]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <section className="rounded-2xl bg-white p-6 ring-1 ring-[#e4e6f0]">
        <ImageUploadField label="Subir nueva foto" folder={tab.folder} value={null} onChange={(url) => void handleUploaded(url)} />
      </section>

      {!images && <p className="text-sm text-[#6d6e7a]">Cargando fotos...</p>}
      {images && images.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#6d6e7a] ring-1 ring-[#e4e6f0]">{tab.empty}</p>
      )}

      {images && images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <figure key={image.id} className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-[#e4e6f0]">
              {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
              <img src={image.image_url} alt={image.caption ?? tab.label} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => void handleDelete(image)}
                aria-label="Eliminar foto"
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow hover:bg-red-50"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
