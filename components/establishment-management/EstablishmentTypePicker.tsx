"use client";

import { BedDouble, Coffee, Martini, ShoppingBag, Sparkles, Store, Utensils, type LucideIcon } from "lucide-react";
import {
  ESTABLISHMENT_TYPE_HINT,
  ESTABLISHMENT_TYPE_KEYS,
  ESTABLISHMENT_TYPES,
  type EstablishmentType,
} from "@/lib/establishments-api";

const TYPE_ICON: Record<EstablishmentType, LucideIcon> = {
  RESTAURANT: Utensils,
  CAFE: Coffee,
  BAR: Martini,
  HOTEL: BedDouble,
  EXPERIENCE: Sparkles,
  STORE: ShoppingBag,
  OTHER: Store,
};

type EstablishmentTypePickerProps = {
  value: EstablishmentType;
  onChange: (value: EstablishmentType) => void;
  // Texto del grupo para lectores de pantalla (el título visible lo pone quien lo usa).
  label?: string;
};

// Tipo de establecimiento (B7): decide el filtro "Tipo" de explorar y el icono del marcador en el mapa.
// La categoría sigue siendo texto libre dentro del tipo (p. ej. "Parrilla" dentro de Restaurante).
// Se usa en el registro del establecimiento y en su perfil (también cuando el admin lo gestiona).
export default function EstablishmentTypePicker({ value, onChange, label = "Tipo de establecimiento" }: EstablishmentTypePickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ESTABLISHMENT_TYPE_KEYS.map((type) => {
        const Icon = TYPE_ICON[type];
        const selected = value === type;
        return (
          <label
            key={type}
            className={`flex cursor-pointer flex-col gap-1 rounded-xl p-3 text-left ring-2 transition has-[:focus-visible]:ring-[#6868e8] ${
              selected ? "bg-[#eef0ff] ring-[#514ddd]" : "bg-[#f7f8fd] ring-transparent hover:bg-[#eef0ff]"
            }`}
          >
            <input
              type="radio"
              name="establishment-type"
              value={type}
              checked={selected}
              onChange={() => onChange(type)}
              className="sr-only"
            />
            <span className={`flex items-center gap-2 text-sm font-bold ${selected ? "text-[#514ddd]" : "text-[#26344d]"}`}>
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {ESTABLISHMENT_TYPES[type]}
            </span>
            <span className="text-[11px] leading-4 text-[#6d6e7a]">{ESTABLISHMENT_TYPE_HINT[type]}</span>
          </label>
        );
      })}
    </div>
  );
}
