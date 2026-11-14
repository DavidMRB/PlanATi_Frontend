"use client";

import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { formatCop } from "@/lib/format";
import { PLAN_LIMITS } from "@/lib/plans-api";
import type { MenuItem } from "@/lib/restaurant-api";

// Selección del asistente: menu_item_id → cantidad y nota.
export type Selection = Record<number, { quantity: number; notes: string }>;

type MenuItemPickerProps = {
  products: MenuItem[];
  combos: MenuItem[];
  selection: Selection;
  onChange: (selection: Selection) => void;
  // Ítems que el backend rechazó (INVALID_ITEMS) o que ya no están en la carta.
  invalidIds?: number[];
};

// Productos y combos disponibles con cantidad (1–99) y una nota por ítem. Es opcional.
export default function MenuItemPicker({ products, combos, selection, onChange, invalidIds = [] }: MenuItemPickerProps) {
  const lines = Object.keys(selection).length;

  const setQuantity = (item: MenuItem, quantity: number) => {
    const next = { ...selection };
    if (quantity <= 0) delete next[item.id];
    else next[item.id] = { quantity: Math.min(quantity, PLAN_LIMITS.maxQuantity), notes: selection[item.id]?.notes ?? "" };
    onChange(next);
  };

  const setNotes = (item: MenuItem, notes: string) => {
    const current = selection[item.id];
    if (!current) return;
    onChange({ ...selection, [item.id]: { ...current, notes: notes.slice(0, PLAN_LIMITS.itemNotesMax) } });
  };

  const renderGroup = (title: string, items: MenuItem[]) => {
    const available = items.filter((item) => item.is_available);
    if (available.length === 0) return null;
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#6d6e7a]">{title}</h3>
        <ul className="space-y-3">
          {available.map((item) => {
            const selected = selection[item.id];
            const invalid = invalidIds.includes(item.id);
            const limitReached = !selected && lines >= PLAN_LIMITS.maxItems;
            return (
              <li
                key={item.id}
                className={`rounded-2xl p-3 ring-1 transition ${
                  invalid ? "bg-red-50 ring-red-200" : selected ? "bg-[#f3f5ff] ring-[#c9cdf4]" : "bg-white ring-[#eceef7]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#dfe3f7] text-[#9aa0d8]">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
                      <img src={item.image_url} alt="" className="size-full object-cover" />
                    ) : (
                      <UtensilsCrossed aria-hidden="true" className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-[#17243d]">{item.name}</p>
                    {item.combo_items.length > 0 && (
                      <p className="line-clamp-1 text-xs text-[#514ddd]">
                        Incluye: {item.combo_items.map((ci) => `${ci.quantity}× ${ci.product_name ?? ""}`).join(", ")}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#514ddd]">{formatCop(item.price)}</p>
                    {invalid && <p className="text-xs font-semibold text-red-600">Ya no está disponible; quítalo para continuar.</p>}
                  </div>
                  {selected ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${item.name}`}
                        onClick={() => setQuantity(item, selected.quantity - 1)}
                        className="flex size-9 items-center justify-center rounded-lg bg-white text-[#514ddd] ring-1 ring-[#d7dcf2] hover:bg-[#eef0ff]"
                      >
                        <Minus aria-hidden="true" className="size-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={PLAN_LIMITS.maxQuantity}
                        value={selected.quantity}
                        aria-label={`Cantidad de ${item.name}`}
                        onChange={(event) => setQuantity(item, Math.trunc(Number(event.target.value) || 0))}
                        className="h-9 w-12 rounded-lg border border-[#d7dcf2] bg-white text-center text-sm font-bold outline-none"
                      />
                      <button
                        type="button"
                        aria-label={`Agregar uno de ${item.name}`}
                        disabled={selected.quantity >= PLAN_LIMITS.maxQuantity}
                        onClick={() => setQuantity(item, selected.quantity + 1)}
                        className="flex size-9 items-center justify-center rounded-lg bg-white text-[#514ddd] ring-1 ring-[#d7dcf2] hover:bg-[#eef0ff] disabled:opacity-40"
                      >
                        <Plus aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={limitReached}
                      onClick={() => setQuantity(item, 1)}
                      className="flex h-9 items-center gap-1 rounded-lg bg-[#514ddd] px-3 text-xs font-bold text-white hover:bg-[#4542ca] disabled:opacity-40"
                    >
                      <Plus aria-hidden="true" className="size-3.5" />
                      Agregar
                    </button>
                  )}
                </div>
                {selected && (
                  <input
                    type="text"
                    value={selected.notes}
                    maxLength={PLAN_LIMITS.itemNotesMax}
                    onChange={(event) => setNotes(item, event.target.value)}
                    placeholder="Nota (opcional), p. ej. sin cebolla"
                    aria-label={`Nota para ${item.name}`}
                    className="mt-3 h-10 w-full rounded-xl border border-[#d7dcf2] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#6868e8]/40"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const productsGroup = renderGroup("Productos", products);
  const combosGroup = renderGroup("Combos", combos);

  if (!productsGroup && !combosGroup) {
    return <p className="rounded-xl bg-[#f3f5ff] px-4 py-3 text-sm text-[#6d6e7a]">Este lugar no tiene productos disponibles. Puedes continuar sin elegir platos.</p>;
  }

  return (
    <div className="space-y-6">
      {lines >= PLAN_LIMITS.maxItems && (
        <p className="text-xs font-semibold text-amber-700">Llegaste al máximo de {PLAN_LIMITS.maxItems} platos distintos por plan.</p>
      )}
      {productsGroup}
      {combosGroup}
    </div>
  );
}
