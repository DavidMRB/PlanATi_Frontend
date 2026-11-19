"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { LatLng } from "@/lib/geo";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;
const BIAS_RADIUS_M = 30_000;

export type PlaceSelection = LatLng & {
  placeId: string;
  address: string;
  city: string | null;
};

type PlaceAutocompleteInputProps = {
  onSelect: (place: PlaceSelection) => void;
  // Sesgo de resultados hacia este punto (el centro configurado o el pin actual).
  bias: LatLng;
  placeholder?: string;
  autoFocus?: boolean;
};

type Suggestion = { placeId: string; main: string; secondary: string; prediction: google.maps.places.PlacePrediction };

function cityFrom(components: google.maps.places.AddressComponent[] | undefined): string | null {
  const find = (type: string) => components?.find((component) => component.types.includes(type))?.longText ?? null;
  return find("locality") ?? find("administrative_area_level_2");
}

// Input propio sobre Places API (New): AutocompleteSuggestion + una sesión por búsqueda
// (AutocompleteSessionToken), 300 ms de espera y mínimo 3 caracteres para no gastar cuota.
// No usa el widget heredado google.maps.places.Autocomplete.
export default function PlaceAutocompleteInput({
  onSelect,
  bias,
  placeholder = "Escribe la dirección o el nombre del lugar",
  autoFocus = false,
}: PlaceAutocompleteInputProps) {
  const places = useMapsLibrary("places");
  const listId = useId();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestId = useRef(0);
  // El texto puesto al elegir una sugerencia no debe disparar otra búsqueda.
  const skipNextSearch = useRef(false);

  const term = input.trim();
  const biasLat = bias.lat;
  const biasLng = bias.lng;

  useEffect(() => {
    if (!places || term.length < MIN_CHARS) return;
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      sessionToken.current ??= new places.AutocompleteSessionToken();
      const current = ++requestId.current;
      setStatus("loading");
      try {
        const response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: term,
          sessionToken: sessionToken.current,
          includedRegionCodes: ["co"],
          language: "es",
          region: "co",
          locationBias: { center: { lat: biasLat, lng: biasLng }, radius: BIAS_RADIUS_M },
        });
        if (current !== requestId.current) return;
        setSuggestions(
          response.suggestions.flatMap((suggestion) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return [];
            return [
              {
                placeId: prediction.placeId,
                main: prediction.mainText?.text ?? prediction.text.text,
                secondary: prediction.secondaryText?.text ?? "",
                prediction,
              },
            ];
          }),
        );
        setActiveIndex(-1);
        setOpen(true);
        setStatus("idle");
      } catch {
        if (current === requestId.current) {
          setSuggestions([]);
          setStatus("error");
        }
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [places, term, biasLat, biasLng]);

  const visible = open && term.length >= MIN_CHARS ? suggestions : [];

  const choose = async (suggestion: Suggestion) => {
    setOpen(false);
    skipNextSearch.current = true;
    setInput(suggestion.secondary ? `${suggestion.main}, ${suggestion.secondary}` : suggestion.main);
    setStatus("loading");
    try {
      const place = suggestion.prediction.toPlace();
      // Termina la sesión de autocompletado (la cobra Google como una sola).
      await place.fetchFields({ fields: ["id", "location", "formattedAddress", "addressComponents"] });
      sessionToken.current = null;
      const location = place.location;
      if (!location) throw new Error("sin ubicación");
      onSelect({
        lat: location.lat(),
        lng: location.lng(),
        placeId: place.id,
        address: place.formattedAddress ?? suggestion.main,
        city: cityFrom(place.addressComponents),
      });
      setStatus("idle");
    } catch {
      sessionToken.current = null;
      setStatus("error");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (visible.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visible.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? visible.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void choose(visible[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const expanded = visible.length > 0;

  return (
    <div className="relative">
      <label className="flex h-11 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 ring-2 ring-transparent focus-within:ring-[#6868e8]/40">
        <Search aria-hidden="true" className="size-4 shrink-0 text-[#514ddd]" />
        <span className="sr-only">Buscar dirección</span>
        <input
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]"
        />
        {status === "loading" && <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-[#6d6e7a]" />}
      </label>

      {status === "error" && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          No pudimos buscar esa dirección. Inténtalo de nuevo o marca el punto en el mapa.
        </p>
      )}
      {open && term.length >= MIN_CHARS && status === "idle" && suggestions.length === 0 && (
        <p className="mt-1.5 text-xs text-[#6d6e7a]">Sin resultados. Prueba con otra dirección o marca el punto en el mapa.</p>
      )}

      <ul
        id={listId}
        role="listbox"
        aria-label="Sugerencias de direcciones"
        className={`absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-[0_12px_30px_rgba(23,36,61,0.18)] ring-1 ring-[#e4e6f0] ${
          expanded ? "" : "hidden"
        }`}
      >
        {visible.map((suggestion, index) => (
          <li
            key={suggestion.placeId}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // mousedown en vez de click: se adelanta al blur del input.
            onMouseDown={(event) => {
              event.preventDefault();
              void choose(suggestion);
            }}
            className={`flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm ${
              index === activeIndex ? "bg-[#eef0ff]" : "hover:bg-[#f5f6ff]"
            }`}
          >
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-[#17243d]">{suggestion.main}</span>
              {suggestion.secondary && <span className="block truncate text-xs text-[#6d6e7a]">{suggestion.secondary}</span>}
            </span>
          </li>
        ))}
        <li aria-hidden="true" className="border-t border-[#eef0f6] px-3 py-1.5 text-right text-[10px] text-[#81869a]">
          Sugerencias de Google
        </li>
      </ul>
    </div>
  );
}
