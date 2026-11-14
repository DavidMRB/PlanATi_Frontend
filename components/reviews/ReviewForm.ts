"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/auth-api";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_MAX_IMAGES,
  createReview,
  reviewErrorMessage,
  updateReview,
  type MyReview,
  type Review,
} from "@/lib/reviews-api";
import { uploadImage, validateImageFile } from "@/lib/uploads";

export type ReviewImageDraft = {
  key: string;
  // URL pública ya subida (o existente); null mientras sube.
  url: string | null;
  preview: string;
  progress: number;
  error: string | null;
};

type UseReviewFormOptions = {
  establishmentId: number;
  // Reseña a editar; sin ella, se crea una nueva.
  existing?: MyReview | null;
  onSaved: (review: Review | MyReview) => void;
  // 409: ya existía una reseña de este usuario (p. ej. publicada en otra pestaña).
  onConflict?: () => void;
};

let draftCounter = 0;

export function useReviewForm({ establishmentId, existing, onSaved, onConflict }: UseReviewFormOptions) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [images, setImages] = useState<ReviewImageDraft[]>(
    () =>
      existing?.images.map((image) => ({
        key: `existing-${image.id}`,
        url: image.image_url,
        preview: image.image_url,
        progress: 100,
        error: null,
      })) ?? [],
  );
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  const ratingError = touched && rating === 0 ? "Elige de 1 a 5 estrellas." : null;
  const commentLength = comment.trim().length;
  const commentError = commentLength > REVIEW_COMMENT_MAX ? `Máximo ${REVIEW_COMMENT_MAX} caracteres.` : null;
  const isUploading = images.some((image) => image.url === null && !image.error);
  const remainingSlots = REVIEW_MAX_IMAGES - images.length;

  const patchImage = (key: string, patch: Partial<ReviewImageDraft>) =>
    setImages((current) => current.map((image) => (image.key === key ? { ...image, ...patch } : image)));

  // Las fotos se suben al elegirlas; el botón de publicar espera a que terminen.
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadNotice("");
    for (const file of Array.from(files).slice(0, Math.max(0, remainingSlots))) {
      const validation = validateImageFile(file);
      if (validation) {
        setUploadNotice(validation);
        continue;
      }
      const key = `new-${++draftCounter}`;
      const preview = URL.createObjectURL(file);
      setImages((current) => [...current, { key, url: null, preview, progress: 0, error: null }]);
      uploadImage("reviews", file, (progress) => patchImage(key, { progress }))
        .then((url) => patchImage(key, { url, progress: 100 }))
        .catch((error: unknown) => {
          const unavailable = error instanceof ApiError && error.status === 503;
          patchImage(key, { error: unavailable ? "No disponible" : "Falló la subida" });
          setUploadNotice(
            unavailable
              ? "La subida de imágenes no está disponible; puedes publicar sin fotos."
              : "No se pudo subir una de las fotos. Quítala o inténtalo de nuevo.",
          );
        });
    }
    if (files.length > remainingSlots) setUploadNotice(`Puedes adjuntar como máximo ${REVIEW_MAX_IMAGES} fotos.`);
  };

  const removeImage = (key: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.key === key);
      if (removed?.preview.startsWith("blob:")) URL.revokeObjectURL(removed.preview);
      return current.filter((image) => image.key !== key);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setSubmitError("");
    if (rating === 0 || commentError || isUploading) return;

    const payload = {
      rating,
      comment: comment.trim() || null,
      // Las fotos que fallaron no se envían.
      image_urls: images.flatMap((image) => (image.url ? [image.url] : [])),
    };

    setIsSubmitting(true);
    try {
      const saved = existing ? await updateReview(existing.id, payload) : await createReview(establishmentId, payload);
      if (saved) onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && onConflict) {
        onConflict();
        return;
      }
      setSubmitError(reviewErrorMessage(error, "No fue posible guardar tu reseña."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditing: Boolean(existing),
    rating,
    setRating,
    comment,
    setComment,
    commentLength,
    commentError,
    ratingError,
    images,
    addFiles,
    removeImage,
    remainingSlots,
    isUploading,
    uploadNotice,
    isSubmitting,
    submitError,
    handleSubmit,
    // Al reescribir un comentario bloqueado, el texto nuevo pasa por revisión.
    rewritesBlocked: existing?.comment_status === "BLOCKED",
  };
}
