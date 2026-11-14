"use client";

import { BookOpen, CloudUpload, Eye, ImageIcon, Info, Lightbulb, Loader2, Star, Store, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import { IMAGE_ACCEPT, uploadImage, validateImageFile } from "@/lib/uploads";
import type { EstablishmentImage, ImageType, UploadFolder } from "@/lib/restaurant-api";
import type { EstablishmentManagementApi } from "@/lib/management-api";

const TABS: Array<{ value: ImageType; label: string; folder: UploadFolder; icon: typeof Store; empty: string }> = [
  { value: "GALLERY", label: "Fotos del Lugar", folder: "establishments", icon: Store, empty: "Aún no has subido fotos del lugar." },
  { value: "MENU", label: "Fotos del Menú Físico", folder: "menu", icon: BookOpen, empty: "Aún no has subido fotos del menú físico." },
];

type UploadingFile = { id: number; name: string; sizeMb: string; preview: string; progress: number };

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

export default function GalleryManager({ api }: { api: EstablishmentManagementApi }) {
  const [imageType, setImageType] = useState<ImageType>("GALLERY");
  const [allImages, setAllImages] = useState<EstablishmentImage[] | null>(null);
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const tab = TABS.find((item) => item.value === imageType) ?? TABS[0];

  useEffect(() => {
    let cancelled = false;
    api.listImages()
      .then((data) => {
        if (!cancelled) setAllImages(data ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las fotos.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, reloadKey]);

  useEffect(() => {
    api.getProfile()
      .then((profile) => setEstablishmentId(profile?.id ?? null))
      .catch(() => setEstablishmentId(null));
  }, [api]);

  const galleryCount = allImages?.filter((image) => image.image_type === "GALLERY").length ?? 0;
  const menuCount = allImages?.filter((image) => image.image_type === "MENU").length ?? 0;
  const counts: Record<ImageType, number> = { GALLERY: galleryCount, MENU: menuCount };
  const images = (allImages ?? []).filter((image) => image.image_type === imageType);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setError("");
      setMessage("");
      let nextOrder = images.length;
      let saved = 0;

      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(`${file.name}: ${validationError}`);
          continue;
        }

        const id = Date.now() + Math.random();
        const preview = URL.createObjectURL(file);
        setUploads((current) => [
          ...current,
          { id, name: file.name, sizeMb: (file.size / (1024 * 1024)).toFixed(1), preview, progress: 0 },
        ]);

        try {
          const url = await uploadImage(
            tab.folder,
            file,
            (progress) => setUploads((current) => current.map((item) => (item.id === id ? { ...item, progress } : item))),
            api.createUploadUrl,
          );
          await api.createImage({ image_url: url, image_type: imageType, display_order: nextOrder });
          nextOrder += 1;
          saved += 1;
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : "No fue posible subir la foto.");
        } finally {
          URL.revokeObjectURL(preview);
          setUploads((current) => current.filter((item) => item.id !== id));
        }
      }

      if (saved > 0) {
        setMessage(saved === 1 ? "Foto agregada." : `${saved} fotos agregadas.`);
        setReloadKey((key) => key + 1);
      }
    },
    [api, images.length, imageType, tab.folder],
  );

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const handleDelete = async (image: EstablishmentImage) => {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    setError("");
    setMessage("");
    try {
      await api.deleteImage(image.id);
      setMessage("Foto eliminada.");
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar la foto.");
    }
  };

  const total = galleryCount + menuCount;

  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-72 rounded-full bg-[#5df0dc]/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <h1 className="max-w-xl text-3xl font-extrabold sm:text-4xl">Galería Multimedia del Establecimiento</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c6f7f0] px-3 py-1 text-xs font-bold text-[#0b6b5c]">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#0b6b5c]" />
              Sincronizado en tiempo real
            </span>
            <p className="max-w-xl text-base text-[#43506a]">
              Administra el material fotográfico que descubren los comensales en la app PlanATi. Una imagen cuidada
              incrementa las visitas a tu establecimiento.
            </p>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#26344d]">
              <ImageIcon aria-hidden="true" className="size-4 text-[#514ddd]" />
              {total} {total === 1 ? "foto publicada" : "fotos publicadas"}
            </p>
          </div>
          {establishmentId && (
            <Link
              href={`/establishments/${establishmentId}`}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#e3f7f3] px-6 py-3.5 text-sm font-bold text-[#0b6b5c] hover:bg-[#d3f1ea]"
            >
              <Eye aria-hidden="true" className="size-4" />
              Previsualizar en App
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" className="flex flex-wrap gap-1 rounded-2xl bg-[#e6eaff] p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={imageType === value}
              onClick={() => setImageType(value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                imageType === value ? "bg-white text-[#514ddd] shadow-sm" : "text-[#43506a] hover:text-[#514ddd]"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
              <span className="rounded-full bg-[#eef0ff] px-2 py-0.5 text-xs text-[#514ddd]">{counts[value]}</span>
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-[#43506a]">
          <Info aria-hidden="true" className="size-4 text-[#514ddd]" />
          Recomendación: dimensiones sugeridas 1920×1080 (16:9)
        </p>
      </div>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <section className={`${card} space-y-5 p-5 sm:p-6`}>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging ? "border-[#514ddd] bg-[#eef0ff]" : "border-[#c9cdf4] bg-[#f8f9ff] hover:bg-[#f3f5ff]"
          }`}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-[#e6eaff] text-[#514ddd]">
            <CloudUpload aria-hidden="true" className="size-7" />
          </span>
          <p className="text-lg font-bold">Arrastra y suelta tus fotos aquí o haz clic para explorar</p>
          <p className="max-w-md text-sm text-[#43506a]">
            Soporte para formatos <strong>JPG, PNG y WEBP</strong> de hasta 5 MB por archivo.
          </p>
          <span className="flex items-center gap-2 rounded-lg bg-[#e6eaff] px-4 py-2 text-xs font-bold text-[#514ddd]">
            <ImageIcon aria-hidden="true" className="size-4" />
            Seleccionar archivo desde el ordenador
          </span>
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void uploadFiles(files);
            }}
          />
        </label>

        {uploads.map((upload) => (
          <div key={upload.id} className="rounded-2xl bg-[#eef0ff] p-4">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
              <img src={upload.preview} alt="" className="size-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {upload.name} <span className="font-normal text-[#6d6e7a]">({upload.sizeMb} MB)</span>
                </p>
                <p className="flex items-center gap-1.5 text-xs text-[#514ddd]">
                  <Loader2 aria-hidden="true" className="size-3 animate-spin" />
                  Subiendo imagen...
                </p>
              </div>
              <span className="text-xl font-extrabold text-[#514ddd]">{upload.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-[linear-gradient(90deg,#514ddd,#0b6b5c)] transition-all" style={{ width: `${upload.progress}%` }} />
            </div>
          </div>
        ))}
      </section>

      {!allImages && !error && <p className="text-sm text-[#6d6e7a]">Cargando fotos...</p>}
      {allImages && images.length === 0 && (
        <p className={`${card} p-8 text-center text-sm text-[#6d6e7a]`}>{tab.empty}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {images.map((image, index) => (
            <figure key={image.id} className={`${card} group overflow-hidden`}>
              <div className="relative aspect-[4/3] bg-[#eef0ff]">
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2 */}
                <img src={image.image_url} alt={image.caption ?? tab.label} className="size-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#514ddd] px-3 py-1 text-xs font-bold text-white">
                    <Star aria-hidden="true" className="size-3 fill-current" />
                    Foto principal
                  </span>
                )}
                {image.caption && index !== 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#17243d]">
                    {image.caption}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(image)}
                  aria-label="Eliminar foto"
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-100 shadow hover:bg-red-50 md:opacity-0 md:transition md:group-hover:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <figcaption className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="truncate text-sm font-bold">{image.caption ?? `${tab.label} ${index + 1}`}</span>
                <span className="shrink-0 rounded-md bg-[#c6f7f0] px-2 py-0.5 text-[11px] font-bold text-[#0b6b5c]">
                  Publicada
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <section className={`${card} grid gap-6 p-6 md:grid-cols-3`}>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#514ddd]">
            <Store aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold">Fotos del lugar</p>
            <p className="text-3xl font-extrabold text-[#514ddd]">{galleryCount}</p>
            <p className="text-xs text-[#6d6e7a]">Visibles en tu ficha pública</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#c6f7f0] text-[#0b6b5c]">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold">Fotos del menú</p>
            <p className="text-3xl font-extrabold text-[#0b6b5c]">{menuCount}</p>
            <p className="text-xs text-[#6d6e7a]">Carta física para tus clientes</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6eaff] text-[#514ddd]">
            <Lightbulb aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold">Consejo para tu galería</p>
            <p className="text-xs leading-relaxed text-[#43506a]">
              Las fotos tomadas con buena luz natural y en horizontal reciben más clics. Sube primero tu mejor foto:
              será la principal.
            </p>
          </div>
        </div>
      </section>

      {uploads.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-[#6d6e7a]">
          <X aria-hidden="true" className="size-3" />
          No cierres esta página mientras se suben las fotos.
        </p>
      )}
    </div>
  );
}
