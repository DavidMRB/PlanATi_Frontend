"use client";

import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import Modal from "@/components/ui/Modal";
import type { EstablishmentManagementApi } from "@/lib/management-api";
import type { MenuItem, ProductPayload } from "@/lib/restaurant-api";

type ProductModalProps = {
  // Panel del restaurante o admin gestionando el local.
  api: EstablishmentManagementApi;
  product: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

// Alta y edición de productos individuales. Un producto se crea siempre con is_combo = false.
export default function ProductModal({ api, product, onClose, onSaved }: ProductModalProps) {
  const isEditing = product !== null;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nameIsValid = name.trim().length >= 1 && name.trim().length <= 120;
  const priceIsValid = price !== "" && Number(price) > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!nameIsValid || !priceIsValid) {
      setError("Revisa el nombre (máx. 120 caracteres) y el precio (mayor a 0).");
      return;
    }

    const payload: ProductPayload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      image_url: imageUrl,
      is_available: isAvailable,
    };

    setIsSaving(true);
    try {
      if (product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? "Editar producto" : "Nuevo producto"} onClose={onClose} widthClass="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <ImageUploadField label="Imagen" folder="products" value={imageUrl} onChange={setImageUrl} createUploadUrl={api.createUploadUrl} />

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Nombre</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Descripción</span>
          <textarea rows={3} className={`${inputClass} h-auto py-3`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Precio (COP)</span>
          <input
            type="number"
            min={1}
            step="100"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold text-[#26344d]">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="size-5 accent-[#4c4cdd]"
          />
          Disponible para pedidos
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6d6e7a] hover:bg-[#f3f5fb]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#514ddd] px-5 py-2 text-sm font-bold text-white hover:bg-[#4542ca] disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
