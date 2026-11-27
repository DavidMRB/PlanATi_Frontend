"use client";

import { Package, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import ComboModal from "@/components/restaurant/ComboModal";
import { formatCop } from "@/lib/format";
import type { MenuItem } from "@/lib/restaurant-api";
import type { EstablishmentManagementApi } from "@/lib/management-api";

type KindFilter = "all" | "single" | "bundle";

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

const isBundle = (combo: MenuItem) => combo.combo_items.length > 0;

export default function CombosManager({ api, exportAction }: { api: EstablishmentManagementApi; exportAction?: ReactNode }) {
  const [combos, setCombos] = useState<MenuItem[] | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [hideUnavailable, setHideUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.listProducts()
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
  }, [api, reloadKey]);

  const productPrice = useMemo(() => new Map(products.map((product) => [product.id, Number(product.price)])), [products]);

  // Precio "normal" del combo compuesto: suma de sus productos x cantidad.
  const regularPrice = (combo: MenuItem) =>
    combo.combo_items.reduce((total, item) => total + (productPrice.get(item.product_id) ?? 0) * item.quantity, 0);

  const all = combos ?? [];
  const counts: Record<KindFilter, number> = {
    all: all.length,
    single: all.filter((combo) => !isBundle(combo)).length,
    bundle: all.filter(isBundle).length,
  };
  const activeCount = all.filter((combo) => combo.is_available).length;

  const visible = all.filter((combo) => {
    if (kind === "single" && isBundle(combo)) return false;
    if (kind === "bundle" && !isBundle(combo)) return false;
    if (hideUnavailable && !combo.is_available) return false;
    return true;
  });

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

  const handleToggleAvailability = async (combo: MenuItem) => {
    setError("");
    setMessage("");
    try {
      await api.updateCombo(combo.id, { is_available: !combo.is_available });
      setReloadKey((key) => key + 1);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No fue posible cambiar la disponibilidad.");
    }
  };

  const handleDelete = async (combo: MenuItem) => {
    if (!window.confirm(`¿Eliminar el combo "${combo.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await api.deleteCombo(combo.id);
      setMessage("Combo eliminado.");
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el combo.");
    }
  };

  const filters: Array<{ value: KindFilter; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "single", label: "Combos Unitarios" },
    { value: "bundle", label: "Combos Compuestos" },
  ];

  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-64 rounded-full bg-[#5df0dc]/25 blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold sm:text-4xl">Combos y Experiencias</h1>
                {combos && (
                  <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#514ddd]">
                    {activeCount} {activeCount === 1 ? "combo activo" : "combos activos"}
                  </span>
                )}
              </div>
              <p className="max-w-2xl text-base text-[#43506a]">
                Configura paquetes gastronómicos y promociones especiales para tus comensales. Los combos optimizan
                inventario e impulsan los pedidos para grupos y parejas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {exportAction}
              <button
                type="button"
                onClick={openCreate}
                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#514ddd] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(81,77,221,0.3)] hover:bg-[#4542ca]"
              >
                <PlusCircle aria-hidden="true" className="size-5" />
                Nuevo combo
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eef0f8] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    kind === value ? "bg-[#0b6b5c] text-white" : "bg-[#e6eaff] text-[#26344d] hover:bg-[#dbe1ff]"
                  }`}
                >
                  {label} ({counts[value]})
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#43506a]">
              <button
                type="button"
                role="switch"
                aria-checked={hideUnavailable}
                onClick={() => setHideUnavailable((value) => !value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${hideUnavailable ? "bg-[#0b6b5c]" : "bg-[#dfe3f2]"}`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${hideUnavailable ? "left-5.5" : "left-0.5"}`}
                />
              </button>
              Ocultar no disponibles
            </label>
          </div>
        </div>
      </header>

      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!combos && !error && <p className="text-sm text-[#6d6e7a]">Cargando combos...</p>}
      {combos && combos.length === 0 && (
        <p className={`${card} p-8 text-center text-sm text-[#6d6e7a]`}>
          Aún no tienes combos. Crea uno unitario o arma uno con tus productos.
        </p>
      )}
      {combos && combos.length > 0 && visible.length === 0 && (
        <p className={`${card} p-8 text-center text-sm text-[#6d6e7a]`}>No hay combos con estos filtros.</p>
      )}

      {visible.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((combo) => {
            const bundle = isBundle(combo);
            const regular = regularPrice(combo);
            const price = Number(combo.price);
            const savings = bundle && regular > price ? Math.round(((regular - price) / regular) * 100) : 0;
            const unavailable = !combo.is_available;

            return (
              <article key={combo.id} className={`${card} flex flex-col overflow-hidden`}>
                <div className="relative h-48 bg-[linear-gradient(135deg,#3f3bb5,#6d69ea)]">
                  {combo.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                    <img
                      src={combo.image_url}
                      alt=""
                      className={`absolute inset-0 size-full object-cover ${unavailable ? "grayscale" : ""}`}
                    />
                  ) : (
                    <Package aria-hidden="true" className="absolute right-4 top-1/2 size-16 -translate-y-1/2 text-white/30" />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent ${unavailable ? "bg-black/30" : ""}`} />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#514ddd] px-3 py-1 text-xs font-bold text-white">
                      {bundle ? "Compuesto" : "Unitario"}
                    </span>
                    {savings > 0 && (
                      <span className="rounded-full bg-[#5df0dc] px-3 py-1 text-xs font-bold text-[#0b4a40]">
                        Ahorro {savings}%
                      </span>
                    )}
                    {unavailable && (
                      <span className="rounded-full bg-[#d6154a] px-3 py-1 text-xs font-bold text-white">Agotado</span>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    {savings > 0 && (
                      <p className="text-xs font-semibold text-white/80 line-through">{formatCop(regular)} COP</p>
                    )}
                    <p className="text-2xl font-extrabold">{formatCop(combo.price)} COP</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <h2 className={`text-xl font-extrabold leading-snug ${unavailable ? "text-[#6d6e7a]" : ""}`}>
                    {combo.name}
                  </h2>
                  {combo.description && <p className="line-clamp-2 text-sm text-[#43506a]">{combo.description}</p>}

                  {bundle && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#6d6e7a]">Incluye:</p>
                      <ul className="flex flex-wrap gap-2">
                        {combo.combo_items.map((item) => (
                          <li
                            key={item.product_id}
                            className="rounded-lg bg-[#eef0ff] px-3 py-1.5 text-xs font-semibold text-[#26344d]"
                          >
                            <span className="font-extrabold text-[#514ddd]">{item.quantity}x</span>{" "}
                            {item.product_name ?? `Producto ${item.product_id}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-[#eef0f8] pt-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={combo.is_available}
                        onClick={() => void handleToggleAvailability(combo)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${combo.is_available ? "bg-[#0b6b5c]" : "bg-[#dfe3f2]"}`}
                      >
                        <span
                          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${combo.is_available ? "left-5.5" : "left-0.5"}`}
                        />
                        <span className="sr-only">Cambiar disponibilidad</span>
                      </button>
                      <span className={`text-sm font-bold ${combo.is_available ? "text-[#0b6b5c]" : "text-[#d6154a]"}`}>
                        {combo.is_available ? "Disponible" : "Agotado"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(combo)}
                        aria-label={`Editar ${combo.name}`}
                        className="rounded-lg p-2 text-[#6d6e7a] hover:bg-[#eef0ff] hover:text-[#514ddd]"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(combo)}
                        aria-label={`Eliminar ${combo.name}`}
                        className="rounded-lg p-2 text-[#6d6e7a] hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <ComboModal
          api={api}
          combo={editing}
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => void handleSaved()}
        />
      )}
    </div>
  );
}
