"use client";

import { AlertTriangle, ExternalLink, Loader2, LocateFixed, MapPin, MousePointerClick, Search } from "lucide-react";
import { GEO_STATUS_MESSAGE } from "@/hooks/useGeolocation";
import LocationPurposeNote from "@/components/privacy/LocationPurposeNote";
import { mapsSearchUrl } from "@/lib/geo";
import { hasMapsApiKey } from "@/lib/maps-config";
import { LocationPickerMap } from "./lazy";
import { useLocationPicker, type LocationValue, type PickerMode } from "./LocationPicker.ts";
import MapUnavailable from "./MapUnavailable";

type LocationPickerProps = {
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
  // Dirección escrita en el formulario: el selector solo la sugiere, nunca la cambia sin permiso.
  address: string;
  onUseAddress: (address: string) => void;
  previewName?: string;
  establishmentType?: string | null;
  error?: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  GPS: "por GPS",
  ADDRESS: "por dirección",
  MAP_PIN: "en el mapa",
  MANUAL: "con coordenadas",
};

const TABS: Array<{ mode: PickerMode; label: string; icon: typeof Search }> = [
  { mode: "search", label: "Buscar dirección", icon: Search },
  { mode: "gps", label: "Usar mi ubicación", icon: LocateFixed },
  { mode: "pin", label: "Marcar en el mapa", icon: MousePointerClick },
];

const inputClass =
  "h-11 w-full rounded-xl bg-[#eef2ff] px-4 text-sm text-[#17243d] outline-none ring-2 ring-transparent transition focus:ring-[#6868e8]/40";

// Selector de ubicación del establecimiento (sección 7.2 del plan): GPS, dirección con autocompletado o
// clic en el mapa, siempre con pin arrastrable. Sin clave de Google: GPS y coordenadas manuales.
export default function LocationPicker({
  value,
  onChange,
  address,
  onUseAddress,
  previewName = "",
  establishmentType,
  error,
}: LocationPickerProps) {
  const picker = useLocationPicker({ value, onChange, address, onUseAddress });
  const { geo } = picker;

  const gpsButton = (
    <button
      type="button"
      onClick={() => void picker.useGps()}
      disabled={geo.isLocating}
      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#dfe3ff] px-5 text-sm font-bold text-[#514ddd] transition hover:bg-[#d2d7ff] disabled:opacity-60"
    >
      {geo.isLocating ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LocateFixed aria-hidden="true" className="size-4" />}
      {geo.isLocating ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
    </button>
  );

  const manualFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#26344d]">Latitud</span>
          <input
            inputMode="decimal"
            className={inputClass}
            value={picker.manual.lat}
            onChange={(event) => picker.updateManual("lat", event.target.value)}
            placeholder="7.889100"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#26344d]">Longitud</span>
          <input
            inputMode="decimal"
            className={inputClass}
            value={picker.manual.lng}
            onChange={(event) => picker.updateManual("lng", event.target.value)}
            placeholder="-72.496700"
          />
        </label>
      </div>
      {value && (
        <a
          href={mapsSearchUrl(value.latitude, value.longitude)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#514ddd] hover:underline"
        >
          Verificar el punto en Google Maps
          <ExternalLink aria-hidden="true" className="size-3" />
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {hasMapsApiKey ? (
        <>
          <div role="tablist" aria-label="Cómo ubicar el establecimiento" className="grid grid-cols-3 gap-1 rounded-xl bg-[#eef0ff] p-1">
            {TABS.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={picker.mode === mode}
                onClick={() => picker.setMode(mode)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition sm:flex-row sm:text-sm ${
                  picker.mode === mode ? "bg-white text-[#514ddd] shadow-sm" : "text-[#43506a] hover:text-[#514ddd]"
                }`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {picker.mode === "gps" && gpsButton}

          <LocationPickerMap
            value={value}
            mode={picker.mode}
            previewName={previewName}
            establishmentType={establishmentType}
            onPick={picker.pick}
            onGeocoded={picker.handleGeocoded}
          />
          <p className="text-xs text-[#6d6e7a]">
            {value
              ? "Así te verán en el mapa. Arrastra el pin para ajustar el punto exacto."
              : "Elige una forma de ubicar tu local; después podrás arrastrar el pin para ajustarlo."}
          </p>

          <details className="rounded-xl bg-[#f6f7ff] px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-[#26344d]">Avanzado: coordenadas</summary>
            <div className="pt-3">{manualFields}</div>
          </details>
        </>
      ) : (
        <>
          <MapUnavailable compact>
            <p className="max-w-xs text-xs text-[#6d6e7a]">Usa el GPS de tu dispositivo o escribe las coordenadas.</p>
          </MapUnavailable>
          {gpsButton}
          {manualFields}
        </>
      )}

      {geo.message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {geo.message ?? GEO_STATUS_MESSAGE.error}
        </p>
      )}
      {picker.lowAccuracy !== null && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          La ubicación es aproximada (±{picker.lowAccuracy} m); ajusta el pin en el mapa.
        </p>
      )}

      {picker.suggestion && (
        <div className="flex flex-col gap-2 rounded-xl bg-[#eef0ff] px-4 py-3 text-sm sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-[#26344d]">
            ¿Usar <span className="font-semibold">“{picker.suggestion}”</span> como dirección?
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={picker.acceptSuggestion}
              className="rounded-lg bg-[#514ddd] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4542ca]"
            >
              Usar
            </button>
            <button
              type="button"
              onClick={picker.dismissSuggestion}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#43506a] hover:bg-white"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {value && (
        <p className="flex items-center gap-2 text-xs text-[#43506a]">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-[#0b6b5c]" />
          Ubicación marcada {SOURCE_LABEL[value.location_source] ?? ""}
          {value.city ? ` · ${value.city}` : ""} · {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <LocationPurposeNote variant="establishment" />
    </div>
  );
}
