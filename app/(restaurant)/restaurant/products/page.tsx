"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProductModal from "@/components/restaurant/ProductModal";
import { ApiError } from "@/lib/auth-api";
import { formatCop } from "@/lib/format";
import { deleteProduct, listProducts, updateProduct, type MenuItem } from "@/lib/restaurant-api";

const IN_COMBO_MESSAGE = "El producto no se puede eliminar porque forma parte de un combo activo.";

export default function RestaurantProductsPage() {
  const [products, setProducts] = useState<MenuItem[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => {
        if (!cancelled) setProducts((data ?? []).filter((item) => !item.is_combo));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los productos.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (product: MenuItem) => {
    setEditing(product);
    setIsModalOpen(true);
  };

  const handleSaved = async () => {
    setIsModalOpen(false);
    setMessage(editing ? "Producto actualizado." : "Producto creado.");
    setReloadKey((key) => key + 1);
  };

  const handleToggleAvailability = async (product: MenuItem) => {
    setError("");
    setMessage("");
    try {
      await updateProduct(product.id, { is_available: !product.is_available });
      setReloadKey((key) => key + 1);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No fue posible cambiar la disponibilidad.");
    }
  };

  const handleDelete = async (product: MenuItem) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteProduct(product.id);
      setMessage("Producto eliminado.");
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError && deleteError.status === 409
          ? IN_COMBO_MESSAGE
          : deleteError instanceof Error
            ? deleteError.message
            : "No fue posible eliminar el producto.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-[#6d6e7a]">Platos y bebidas individuales de tu carta.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 self-start rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo producto
        </button>
      </header>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!products && !error && <p className="text-sm text-[#6d6e7a]">Cargando productos...</p>}
      {products && products.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#6d6e7a] ring-1 ring-[#e4e6f0]">
          Aún no tienes productos. Crea el primero para armar tu carta.
        </p>
      )}

      {products && products.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#e4e6f0]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[#e4e6f0] text-xs uppercase tracking-wide text-[#9295a4]">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Disponible</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f8]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#f8f9ff]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#eef2ff]">
                        {product.image_url && (
                          <Image src={product.image_url} alt="" fill unoptimized sizes="48px" className="object-cover" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        {product.description && <p className="line-clamp-1 text-xs text-[#6d6e7a]">{product.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCop(product.price)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.is_available}
                      onClick={() => void handleToggleAvailability(product)}
                      className={`relative h-6 w-11 rounded-full transition ${product.is_available ? "bg-emerald-500" : "bg-[#c9cdd9]"}`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${product.is_available ? "left-5.5" : "left-0.5"}`}
                      />
                      <span className="sr-only">Cambiar disponibilidad</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        aria-label={`Editar ${product.name}`}
                        className="rounded-lg p-2 text-[#4c4cdd] hover:bg-[#eef2ff]"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        aria-label={`Eliminar ${product.name}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductModal product={editing} onClose={() => setIsModalOpen(false)} onSaved={() => void handleSaved()} />
      )}
    </div>
  );
}
