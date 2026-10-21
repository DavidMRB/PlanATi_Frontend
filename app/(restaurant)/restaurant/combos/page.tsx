"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ComboModal from "@/components/restaurant/ComboModal";
import { formatCop } from "@/lib/format";
import { deleteCombo, listProducts, type MenuItem } from "@/lib/restaurant-api";

export default function RestaurantCombosPage() {
  const [combos, setCombos] = useState<MenuItem[] | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => {
        if (cancelled) return;
        const all = data ?? [];
        setCombos(all.filter((item) => item.is_combo));
        setProducts(all.filter((item) => !item.is_combo));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los combos.");
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

  const openEdit = (combo: MenuItem) => {
    setEditing(combo);
    setIsModalOpen(true);
  };

  const handleSaved = async () => {
    setIsModalOpen(false);
    setMessage(editing ? "Combo actualizado." : "Combo creado.");
    setReloadKey((key) => key + 1);
  };

  const handleDelete = async (combo: MenuItem) => {
    if (!window.confirm(`¿Eliminar el combo "${combo.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteCombo(combo.id);
      setMessage("Combo eliminado.");
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el combo.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Combos</h1>
          <p className="text-sm text-[#6d6e7a]">Ofertas unitarias o combinaciones de tus productos.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 self-start rounded-xl bg-[#514ddd] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] hover:bg-[#4542ca]"
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo combo
        </button>
      </header>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!combos && !error && <p className="text-sm text-[#6d6e7a]">Cargando combos...</p>}
      {combos && combos.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#6d6e7a] ring-1 ring-[#e4e6f0]">
          Aún no tienes combos. Crea uno unitario o arma uno con tus productos.
        </p>
      )}

      {combos && combos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {combos.map((combo) => (
            <article key={combo.id} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e6f0]">
              <div className="relative aspect-video bg-[#eef2ff]">
                {combo.image_url && <Image src={combo.image_url} alt="" fill unoptimized sizes="(min-width: 1280px) 33vw, 50vw" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{combo.name}</h2>
                    <p className="text-xs font-semibold text-[#4c4cdd]">
                      {combo.combo_items.length > 0 ? "Compuesto" : "Unitario"}
                      {!combo.is_available && " · No disponible"}
                    </p>
                  </div>
                  <p className="font-bold">{formatCop(combo.price)}</p>
                </div>

                {combo.combo_items.length > 0 && (
                  <ul className="space-y-1 text-sm text-[#43506a]">
                    {combo.combo_items.map((item) => (
                      <li key={item.product_id}>
                        {item.quantity} × {item.product_name ?? `Producto ${item.product_id}`}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(combo)}
                    aria-label={`Editar ${combo.name}`}
                    className="rounded-lg p-2 text-[#4c4cdd] hover:bg-[#eef2ff]"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(combo)}
                    aria-label={`Eliminar ${combo.name}`}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ComboModal
          combo={editing}
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => void handleSaved()}
        />
      )}
    </div>
  );
}
