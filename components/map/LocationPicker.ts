"use client";

import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { LocationSource } from "@/lib/establishments-api";
import { isInsideServiceArea, type LatLng } from "@/lib/geo";
import { hasMapsApiKey, mapsConfig } from "@/lib/maps-config";

// Ubicación del establecimiento que devuelve el selector. La dirección escrita es aparte (la maneja el
// formulario): el selector solo la sugiere.
export type LocationValue = {
  latitude: number;
  longitude: number;
  location_source: LocationSource;
  google_place_id: string | null;
  city: string | null;
};

export type PickerMode = "search" | "gps" | "pin";

export type MapPick = LatLng & {
  source: LocationSource;
  placeId?: string | null;
  city?: string | null;
  address?: string | null;
};

const LOW_ACCURACY_M = 100;
export const OUT_OF_AREA_MESSAGE = "La ubicación está fuera del área de servicio de PlanATi.";

// Validación común de los formularios (registro, perfil, re-aplicación).
export function validateLocation(value: LocationValue | null, required = true): string | null {
  if (!value) return required ? "Marca la ubicación de tu establecimiento." : null;
  if (!isInsideServiceArea({ lat: value.latitude, lng: value.longitude }, mapsConfig.serviceArea)) {
    return OUT_OF_AREA_MESSAGE;
  }
  return null;
}

// Campos para el payload de la API (latitud y longitud siempre juntas).
export function locationPayload(value: LocationValue | null) {
  if (!value) return {};
  return {
    latitude: value.latitude,
    longitude: value.longitude,
    location_source: value.location_source,
    google_place_id: value.google_place_id,
    city: value.city,
  };
}

export function locationFromProfile(profile: {
  latitude: string | null;
  longitude: string | null;
  location_source?: LocationSource | null;
  google_place_id?: string | null;
  city?: string | null;
}): LocationValue | null {
  const latitude = Number(profile.latitude);
  const longitude = Number(profile.longitude);
  if (profile.latitude === null || profile.longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    latitude,
    longitude,
    location_source: profile.location_source ?? "MANUAL",
    google_place_id: profile.google_place_id ?? null,
    city: profile.city ?? null,
  };
}

type UseLocationPickerOptions = {
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
  address: string;
  onUseAddress: (address: string) => void;
};

export function useLocationPicker({ value, onChange, address, onUseAddress }: UseLocationPickerOptions) {
  const geo = useGeolocation({ mode: "precise", auto: false });
  const [mode, setMode] = useState<PickerMode>(hasMapsApiKey ? "search" : "gps");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Campos manuales (Avanzado): se sincronizan cuando el punto cambia por otra vía.
  const [manual, setManual] = useState({ lat: value ? String(value.latitude) : "", lng: value ? String(value.longitude) : "" });
  const [syncedFrom, setSyncedFrom] = useState<LocationValue | null>(value);
  if (value !== syncedFrom) {
    setSyncedFrom(value);
    if (value && value.location_source !== "MANUAL") {
      setManual({ lat: value.latitude.toFixed(6), lng: value.longitude.toFixed(6) });
    }
  }

  // Nunca se sobrescribe la dirección escrita sin que la persona la acepte; si está vacía, se rellena.
  const offerAddress = (candidate: string | null | undefined) => {
    const text = candidate?.trim();
    if (!text) return;
    if (!address.trim()) {
      onUseAddress(text);
      setSuggestion(null);
    } else if (text !== address.trim()) {
      setSuggestion(text);
    }
  };

  const pick = (point: MapPick) => {
    if (point.source !== "GPS") setAccuracy(null);
    onChange({
      latitude: point.lat,
      longitude: point.lng,
      location_source: point.source,
      google_place_id: point.source === "ADDRESS" ? (point.placeId ?? null) : null,
      city: point.city ?? (point.source === "MAP_PIN" ? null : (value?.city ?? null)),
    });
    if (point.source === "ADDRESS") offerAddress(point.address);
  };

  const useGps = async () => {
    const position = await geo.request();
    if (!position) return;
    setAccuracy(position.accuracy);
    pick({ lat: position.lat, lng: position.lng, source: "GPS" });
  };

  // Resultado de la geocodificación inversa del punto (GPS o pin): ciudad y dirección sugerida.
  const handleGeocoded = (result: { address: string; city: string | null }, point: LatLng) => {
    if (!value || value.latitude !== point.lat || value.longitude !== point.lng) return;
    if (result.city && result.city !== value.city) onChange({ ...value, city: result.city });
    offerAddress(result.address);
  };

  const updateManual = (field: "lat" | "lng", text: string) => {
    const next = { ...manual, [field]: text };
    setManual(next);
    const lat = Number(next.lat);
    const lng = Number(next.lng);
    if (next.lat.trim() && next.lng.trim() && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      setAccuracy(null);
      onChange({ latitude: lat, longitude: lng, location_source: "MANUAL", google_place_id: null, city: value?.city ?? null });
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) onUseAddress(suggestion);
    setSuggestion(null);
  };

  return {
    mode,
    setMode,
    geo,
    useGps,
    pick,
    handleGeocoded,
    suggestion,
    acceptSuggestion,
    dismissSuggestion: () => setSuggestion(null),
    manual,
    updateManual,
    lowAccuracy: accuracy !== null && accuracy > LOW_ACCURACY_M ? Math.round(accuracy) : null,
  };
}
