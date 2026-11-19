"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import ImageUploadField from "@/components/common/ImageUploadField";
import Modal from "@/components/ui/Modal";
import { formatCop } from "@/lib/format";
import type { EstablishmentManagementApi } from "@/lib/management-api";
import type { ComboPayload, MenuItem } from "@/lib/restaurant-api";

type ComboMode = "UNIT" | "COMPOSED";
type SelectedItem = { product_id: number; quantity: number };

type ComboModalProps = {
  // Panel del restaurante o admin gestionando el local.
  api: EstablishmentManagementApi;
  combo: MenuItem | null;
  products: MenuItem[];
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

// Modalidad 1 (UNIT): combo independiente, sin productos asociados.
// Modalidad 2 (COMPOSED): combo formado por productos existentes del restaurante.
export default function ComboModal({ api, combo, products, onClose, onSaved }: ComboModalProps) {
  const isEditing = combo !== null;
  const [mode, setMode] = useState<ComboMode>(combo && combo.combo_items.length > 0 ? "COMPOSED" : "UNIT");
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [price, setPrice] = useState(combo?.price ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(combo?.image_url ?? null);
  const [isAvailable, setIsAvailable] = useState(combo?.is_available ?? true);
  const [items, setItems] = useState<SelectedItem[]>(
    combo?.combo_items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })) ?? [],
  );
  const [pendingProductId, setPendingProductId] = useState<string>("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectableProducts = products.filter((product) => !items.some((item) => item.product_id === product.id));

  // Precio sugerido: suma de los productos del combo según sus cantidades.
  const suggestedPrice = items.reduce((total, item) => {
    const product = productById.get(item.product_id);
    return total + (product ? Number(product.price) * item.quantity : 0);
  }, 0);

  const addItem = () => {
    const productId = Number(pendingProductId);
    if (!productId) return;
    setItems((current) => [...current, { product_id: productId, quantity: 1 }]);
    setPendingProductId("");
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)),
    );
  };

  const removeItem = (productId: number) => {
    setItems((current) => current.filter((item) => item.product_id !== productId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (name.trim().length < 1 || name.trim().length > 120 || Number(price) <= 0 || price === "") {
      setError("Revisa el nombre (máx. 120 caracteres) y el precio (mayor a 0).");
      return;
    }
    if (mode === "COMPOSED" && items.length === 0) {
      setError("Un combo compuesto necesita al menos un producto.");
      return;
    }

    const payload: ComboPayload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      image_url: imageUrl,
      is_available: isAvailable,
      items: mode === "COMPOSED" ? items : [],
    };

    setIsSaving(true);
    try {
      if (combo) {
        await api.updateCombo(combo.id, payload);
      } else {
        await api.createCombo(payload);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar el combo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? "Editar combo" : "Nuevo combo"} onClose={onClose} widthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div role="tablist" className="grid grid-cols-2 gap-2 rounded-xl bg-[#eef2ff] p-1">
          {(
            [
              ["UNIT", "Combo unitario"],
              ["COMPOSED", "Combo compuesto"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === value ? "bg-white text-[#4c4cdd] shadow-sm" : "text-[#6d6e7a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6d6e7a]">
          {mode === "UNIT"
            ? "Se guarda como un artículo independiente, sin productos asociados."
            : "Elige productos ya creados en tu carta y la cantidad de cada uno."}
        </p>

        <ImageUploadField label="Imagen" folder="products" value={imageUrl} onChange={setImageUrl} createUploadUrl={api.createUploadUrl} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#26344d]">Nombre</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#26344d]">Precio final (COP)</span>
            <input type="number" min={1} step="100" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#26344d]">Descripción</span>
          <textarea rows={2} className={`${inputClass} h-auto py-3`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {mode === "COMPOSED" && (
          <section className="space-y-3 rounded-xl border border-[#e4e6f0] p-4">
            <div className="flex gap-2">
              <select
                value={pendingProductId}
                onChange={(e) => setPendingProductId(e.target.value)}
                className={`${inputClass} flex-1`}
              >
                <option value="">Selecciona un producto</option>
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatCop(product.price)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addItem}
                disabled={!pendingProductId}
                className="flex items-center gap-1 rounded-xl bg-[#514ddd] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Plus aria-hidden="true" className="size-4" />
                Agregar
              </button>
            </div>

            {items.length === 0 && <p className="text-sm text-[#6d6e7a]">Aún no has agregado productos.</p>}

            <ul className="space-y-2">
              {items.map((item) => {
                const product = productById.get(item.product_id);
                return (
                  <li key={item.product_id} className="flex items-center gap-3 rounded-lg bg-[#f8f9ff] px-3 py-2">
                    <span className="flex-1 truncate text-sm font-semibold">{product?.name ?? `Producto ${item.product_id}`}</span>
                    <span className="text-xs text-[#6d6e7a]">{product ? formatCop(product.price) : ""}</span>
                    <label className="flex items-center gap-1 text-xs text-[#6d6e7a]">
                      Cant.
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                        className="h-8 w-16 rounded-lg bg-white px-2 text-sm outline-none ring-1 ring-[#e4e6f0]"
                      />
                    </label>
                    <button type="button" onClick={() => removeItem(item.product_id)} aria-label="Quitar producto" className="text-[#81869a] hover:text-red-600">
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {items.length > 0 && (
              <p className="text-sm text-[#43506a]">
                Precio sugerido por productos: <span className="font-bold">{formatCop(suggestedPrice)}</span>
              </p>
            )}
          </section>
        )}

        <label className="flex items-center gap-3 text-sm font-semibold text-[#26344d]">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="size-5 accent-[#4c4cdd]" />
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
            {isSaving ? "Guardando..." : "Guardar combo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
