"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { IMAGE_ACCEPT } from "@/lib/uploads";
import { REVIEW_COMMENT_MAX, type MyReview, type Review } from "@/lib/reviews-api";
import { useReviewForm } from "./ReviewForm.ts";
import StarRatingInput from "./StarRatingInput";

type ReviewFormProps = {
  establishmentId: number;
  establishmentName: string;
  existing?: MyReview | null;
  onSaved: (review: Review | MyReview) => void;
  onCancel?: () => void;
  onConflict?: () => void;
  // Recibe el foco al montarse (llegada con ?review=1 o al pulsar "Editar").
  autoFocus?: boolean;
};

// Crear o editar una reseña: estrellas obligatorias; comentario y hasta 5 fotos opcionales.
export default function ReviewForm({
  establishmentId,
  establishmentName,
  existing,
  onSaved,
  onCancel,
  onConflict,
  autoFocus = false,
}: ReviewFormProps) {
  const form = useReviewForm({ establishmentId, existing, onSaved, onConflict });
  const fileInput = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!autoFocus || !root.current) return;
    root.current.scrollIntoView({ block: "center", behavior: "smooth" });
    root.current.querySelector<HTMLInputElement>("input[type=radio]")?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <form
      ref={root}
      onSubmit={form.handleSubmit}
      noValidate
      aria-label={form.isEditing ? "Editar tu reseña" : `Reseñar ${establishmentName}`}
      className="space-y-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(23,36,61,0.06)] ring-1 ring-[#e4e6f0]"
    >
      <p className="text-base font-bold">{form.isEditing ? "Editar tu reseña" : `¿Cómo te fue en ${establishmentName}?`}</p>

      <StarRatingInput value={form.rating} onChange={form.setRating} error={form.ratingError} />

      <label className="block space-y-1.5">
        <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
          Comentario (opcional)
          <span className={`text-xs font-medium ${form.commentError ? "text-red-600" : "text-[#6d6e7a]"}`}>
            {form.commentLength} / {REVIEW_COMMENT_MAX}
          </span>
        </span>
        <textarea
          rows={4}
          value={form.comment}
          onChange={(event) => form.setComment(event.target.value)}
          placeholder="Cuéntale a la comunidad qué te gustó y qué se puede mejorar."
          className="w-full rounded-xl bg-[#eef2ff] px-4 py-3 text-sm leading-relaxed text-[#17243d] outline-none ring-2 ring-transparent transition placeholder:text-[#8e92a3] focus:ring-[#6868e8]/40"
        />
        {form.commentError && <span className="block text-xs font-medium text-red-600">{form.commentError}</span>}
        {form.rewritesBlocked && (
          <span className="block text-xs text-amber-700">Un administrador revisará tu nuevo comentario antes de publicarlo.</span>
        )}
      </label>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#26344d]">Fotos (opcional, hasta 5)</p>
        <ul className="flex flex-wrap gap-2">
          {form.images.map((image) => (
            <li key={image.key} className="relative size-20 overflow-hidden rounded-lg bg-[#eef0ff]">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local o URL pública de R2 */}
              <img src={image.preview} alt="" className={`size-full object-cover ${image.url ? "" : "opacity-50"}`} />
              {image.url === null && !image.error && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#17243d]">{image.progress}%</span>
              )}
              {image.error && (
                <span className="absolute inset-x-0 bottom-0 bg-red-600/90 px-1 py-0.5 text-center text-[10px] font-bold text-white">
                  {image.error}
                </span>
              )}
              <button
                type="button"
                onClick={() => form.removeImage(image.key)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-[#17243d] shadow hover:bg-white"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
          {form.remainingSlots > 0 && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#c9cdf4] text-xs font-semibold text-[#514ddd] hover:bg-[#f5f6ff]"
              >
                <ImagePlus aria-hidden="true" className="size-5" />
                Agregar
              </button>
            </li>
          )}
        </ul>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            form.addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {form.uploadNotice && <p className="text-xs text-amber-700">{form.uploadNotice}</p>}
      </div>

      {form.submitError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {form.submitError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl px-4 text-sm font-semibold text-[#43506a] hover:bg-[#f3f5fb]"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={form.isSubmitting || form.isUploading}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#514ddd] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] disabled:opacity-60"
        >
          {(form.isSubmitting || form.isUploading) && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {form.isUploading ? "Subiendo fotos..." : form.isSubmitting ? "Guardando..." : form.isEditing ? "Guardar cambios" : "Publicar reseña"}
        </button>
      </div>
    </form>
  );
}
