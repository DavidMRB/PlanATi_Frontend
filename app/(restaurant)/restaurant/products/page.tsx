"use client";

import { Ban, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductModal from "@/components/restaurant/ProductModal";
import { ApiError } from "@/lib/auth-api";
import { formatCop } from "@/lib/format";
import { deleteProduct, listProducts, updateProduct, type MenuItem } from "@/lib/restaurant-api";

const IN_COMBO_MESSAGE = "El producto no se puede eliminar porque forma parte de un combo activo.";
const PAGE_SIZES = [8, 16, 32];

type AvailabilityFilter = "all" | "available" | "soldout";

const FILTERS: Array<{ value: AvailabilityFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponibles" },
  { value: "soldout", label: "Agotados" },
];

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

function AvailabilitySwitch({ product, onToggle }: { product: MenuItem; onToggle: (product: MenuItem) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={product.is_available}
      onClick={() => onToggle(product)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${product.is_available ? "bg-[#0b6b5c]" : "bg-[#dfe3f2]"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${product.is_available ? "left-5.5" : "left-0.5"}`}
      />
      <span className="sr-only">Cambiar disponibilidad</span>
    </button>
  );
}

function Thumb({ product, className }: { product: MenuItem; className: string }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[#eef0ff] text-[#9aa0d8] ${className}`}>
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
        <img src={product.image_url} alt="" className="size-full object-cover" />
      ) : (
        <UtensilsCrossed aria-hidden="true" className="size-6" />
      )}
      {!product.is_available && (
        <span className="absolute inset-0 flex items-center justify-center bg-[#17243d]/45 text-white">
          <Ban aria-hidden="true" className="size-6" />
        </span>
      )}
    </span>
  );
}

function RowActions({
  product,
  onEdit,
  onDelete,
}: {
  product: MenuItem;
  onEdit: (product: MenuItem) => void;
  onDelete: (product: MenuItem) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(product)}
        aria-label={`Editar ${product.name}`}
        className="rounded-lg p-2 text-[#6d6e7a] hover:bg-[#eef0ff] hover:text-[#514ddd]"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(product)}
        aria-label={`Eliminar ${product.name}`}
        className="rounded-lg p-2 text-[#6d6e7a] hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export default function RestaurantProductsPage() {
  const [products, setProducts] = useState<MenuItem[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AvailabilityFilter>("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

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

  const counts = useMemo(() => {
    const all = products ?? [];
    return {
      all: all.length,
      available: all.filter((item) => item.is_available).length,
      soldout: all.filter((item) => !item.is_available).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((item) => {
      if (filter === "available" && !item.is_available) return false;
      if (filter === "soldout" && item.is_available) return false;
      if (!term) return true;
      return item.name.toLowerCase().includes(term) || (item.description ?? "").toLowerCase().includes(term);
    });
  }, [products, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

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

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1,
  );

  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-64 rounded-full bg-[#514ddd]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold sm:text-5xl">Productos</h1>
              {products && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#26344d]">
                  <UtensilsCrossed aria-hidden="true" className="size-3.5" />
                  {counts.all} {counts.all === 1 ? "plato registrado" : "platos registrados"}
                </span>
              )}
              {products && counts.available > 0 && (
                <span className="rounded-full bg-[#c6f7f0] px-3 py-1 text-xs font-bold text-[#0b6b5c]">
                  {counts.available} activos
                </span>
              )}
            </div>
            <p className="max-w-2xl text-base text-[#43506a]">
              Administra la carta digital de tu restaurante en PlanATi. Los cambios de precio o disponibilidad se
              reflejan al instante para los comensales.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo producto
          </button>
        </div>
      </header>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              filter === value ? "bg-[#0b6b5c] text-white" : "bg-[#e6eaff] text-[#26344d] hover:bg-[#dbe1ff]"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      <label className={`${card} flex items-center gap-3 px-5 py-3.5`}>
        <Search aria-hidden="true" className="size-5 shrink-0 text-[#9295a4]" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar plato o bebida por nombre o descripción..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9295a4]"
        />
      </label>

      {!products && !error && <p className="text-sm text-[#6d6e7a]">Cargando productos...</p>}
      {products && products.length === 0 && (
        <p className={`${card} p-8 text-center text-sm text-[#6d6e7a]`}>
          Aún no tienes productos. Crea el primero para armar tu carta.
        </p>
      )}
      {products && products.length > 0 && filtered.length === 0 && (
        <p className={`${card} p-8 text-center text-sm text-[#6d6e7a]`}>Ningún producto coincide con tu búsqueda.</p>
      )}

      {visible.length > 0 && (
        <section className={`${card} overflow-hidden`}>
          {/* Escritorio y tablet: tabla */}
          <table className="hidden w-full text-left md:table">
            <thead className="bg-[#f3f5ff] text-[11px] font-bold uppercase tracking-widest text-[#43506a]">
              <tr>
                <th className="px-6 py-4">Plato</th>
                <th className="px-4 py-4">Nombre</th>
                <th className="hidden px-4 py-4 lg:table-cell">Descripción</th>
                <th className="px-4 py-4">Precio COP</th>
                <th className="px-4 py-4">Disponibilidad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id} className={`border-t border-[#eef0f8] ${product.is_available ? "" : "bg-[#fff7f7]"}`}>
                  <td className="px-6 py-4">
                    <Thumb product={product} className="size-16 rounded-xl" />
                  </td>
                  <td className="max-w-[14rem] px-4 py-4">
                    <p className={`text-lg font-bold leading-snug ${product.is_available ? "" : "text-[#6d6e7a]"}`}>
                      {product.name}
                    </p>
                  </td>
                  <td className="hidden max-w-xs px-4 py-4 lg:table-cell">
                    <p className="line-clamp-2 text-sm text-[#43506a]">{product.description || "Sin descripción"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-lg font-extrabold">
                    {formatCop(product.price)} <span className="text-xs font-bold text-[#6d6e7a]">COP</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <AvailabilitySwitch product={product} onToggle={(item) => void handleToggleAvailability(item)} />
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          product.is_available ? "bg-[#e3f7f3] text-[#0b6b5c]" : "bg-[#fde0e3] text-[#d6154a]"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-1.5 rounded-full ${product.is_available ? "bg-[#0b6b5c]" : "bg-[#d6154a]"}`}
                        />
                        {product.is_available ? "Disponible en app" : "Agotado temporalmente"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RowActions product={product} onEdit={openEdit} onDelete={(item) => void handleDelete(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Móvil: tarjetas */}
          <ul className="space-y-4 p-4 md:hidden">
            {visible.map((product) => (
              <li key={product.id} className="rounded-2xl bg-white p-3 shadow-[0_4px_16px_rgba(23,36,61,0.08)]">
                <div className="flex gap-3">
                  <Thumb product={product} className="size-20 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-lg font-extrabold leading-snug ${product.is_available ? "" : "text-[#6d6e7a]"}`}>
                      {product.name}
                    </p>
                    <p className="line-clamp-2 text-xs text-[#43506a]">{product.description || "Sin descripción"}</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-[#514ddd]">
                  {formatCop(product.price)} <span className="text-xs font-bold text-[#6d6e7a]">COP</span>
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f3f5ff] px-3 py-2">
                  <div className="flex items-center gap-3">
                    <AvailabilitySwitch product={product} onToggle={(item) => void handleToggleAvailability(item)} />
                    <span className={`text-xs font-bold ${product.is_available ? "text-[#0b6b5c]" : "text-[#6d6e7a]"}`}>
                      {product.is_available ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                  <RowActions product={product} onEdit={openEdit} onDelete={(item) => void handleDelete(item)} />
                </div>
              </li>
            ))}
          </ul>

          <footer className="flex flex-col gap-4 border-t border-[#eef0f8] px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-[#43506a]">
              <p>
                Mostrando <strong>{start + 1}</strong> a <strong>{start + visible.length}</strong> de{" "}
                <strong>{filtered.length}</strong> productos
              </p>
              <label className="flex items-center gap-2 text-xs">
                Filas por página:
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-md bg-[#eef0ff] px-2 py-1 font-semibold outline-none"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <nav aria-label="Paginación" className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="rounded-lg bg-[#eef0ff] p-2 text-[#514ddd] disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              {pageNumbers.map((number, index) => (
                <span key={number} className="flex items-center gap-1">
                  {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="px-1 text-[#9295a4]">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    aria-current={number === currentPage ? "page" : undefined}
                    className={`size-9 rounded-lg text-sm font-bold ${
                      number === currentPage ? "bg-[#514ddd] text-white" : "text-[#26344d] hover:bg-[#eef0ff]"
                    }`}
                  >
                    {number}
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
                className="rounded-lg bg-[#eef0ff] p-2 text-[#514ddd] disabled:opacity-40"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </nav>
          </footer>
        </section>
      )}

      {isModalOpen && (
        <ProductModal product={editing} onClose={() => setIsModalOpen(false)} onSaved={() => void handleSaved()} />
      )}
    </div>
  );
}
