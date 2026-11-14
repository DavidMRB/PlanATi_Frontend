"use client";

import { AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/geo";
import { mapsConfig } from "@/lib/maps-config";
import type { LocationValue, MapPick, PickerMode } from "./LocationPicker.ts";
import MapsProvider from "./MapsProvider";
import MapUnavailable from "./MapUnavailable";
import MarkerBubble from "./MarkerBubble";
import PlaceAutocompleteInput from "./PlaceAutocompleteInput";

const PICKED_ZOOM = 17;
const GEOCODE_DELAY_MS = 250;

export type LocationPickerMapProps = {
  value: LocationValue | null;
  mode: PickerMode;
  previewName: string;
  establishmentType?: string | null;
  onPick: (pick: MapPick) => void;
  onGeocoded: (result: { address: string; city: string | null }, point: LatLng) => void;
};

function cityFrom(components: google.maps.GeocoderAddressComponent[]): string | null {
  const find = (type: string) => components.find((component) => component.types.includes(type))?.long_name ?? null;
  return find("locality") ?? find("administrative_area_level_2");
}

function PickerMap({ value, mode, previewName, establishmentType, onPick, onGeocoded }: LocationPickerMapProps) {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");
  const point = value ? { lat: value.latitude, lng: value.longitude } : null;
  const lat = point?.lat;
  const lng = point?.lng;
  const source = value?.location_source;

  // La cámara sigue al punto cuando cambia por GPS, búsqueda o coordenadas manuales.
  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    const bounds = map.getBounds();
    if (source !== "MAP_PIN" || !bounds?.contains({ lat, lng })) map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < PICKED_ZOOM - 1) map.setZoom(PICKED_ZOOM);
  }, [map, lat, lng, source]);

  // Geocodificación inversa solo con el punto ya fijado (GPS o pin suelto), nunca mientras se arrastra.
  const onGeocodedRef = useRef(onGeocoded);
  useEffect(() => {
    onGeocodedRef.current = onGeocoded;
  });
  useEffect(() => {
    if (!geocoding || lat === undefined || lng === undefined || (source !== "GPS" && source !== "MAP_PIN")) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { results } = await new geocoding.Geocoder().geocode({ location: { lat, lng }, language: "es" });
        const first = results[0];
        if (!cancelled && first) {
          onGeocodedRef.current({ address: first.formatted_address, city: cityFrom(first.address_components) }, { lat, lng });
        }
      } catch {
        // Sin sugerencia de dirección; el punto sigue siendo válido.
      }
    }, GEOCODE_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [geocoding, lat, lng, source]);

  return (
    <div className="space-y-3">
      {mode === "search" && (
        <PlaceAutocompleteInput
          bias={point ?? mapsConfig.defaultCenter}
          onSelect={(place) =>
            onPick({ lat: place.lat, lng: place.lng, source: "ADDRESS", placeId: place.placeId, city: place.city, address: place.address })
          }
        />
      )}
      <div className="relative h-64 overflow-hidden rounded-2xl sm:h-72">
        <Map
          mapId={mapsConfig.mapId}
          defaultCenter={point ?? mapsConfig.defaultCenter}
          defaultZoom={point ? PICKED_ZOOM : mapsConfig.defaultZoom}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          fullscreenControl
          clickableIcons={false}
          onClick={(event) => {
            const latLng = event.detail.latLng;
            if (mode === "pin" && latLng) onPick({ lat: latLng.lat, lng: latLng.lng, source: "MAP_PIN" });
          }}
          className="size-full"
        >
          {point && (
            <AdvancedMarker
              position={point}
              draggable
              title={`${previewName || "Tu establecimiento"}. Arrastra para ajustar la ubicación.`}
              onDragEnd={(event) => {
                const latLng = event.latLng;
                if (latLng) onPick({ lat: latLng.lat(), lng: latLng.lng(), source: "MAP_PIN" });
              }}
            >
              <MarkerBubble type={establishmentType} label={previewName || "Tu establecimiento"} active />
            </AdvancedMarker>
          )}
        </Map>
        {!point && mode === "pin" && (
          <p className="pointer-events-none absolute inset-x-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-[#43506a] shadow">
            Toca el mapa en el punto exacto de tu local
          </p>
        )}
      </div>
    </div>
  );
}

// Parte del selector que depende de Google Maps (búsqueda, mapa, pin arrastrable). Se carga con
// next/dynamic desde LocationPicker.
export default function LocationPickerMap(props: LocationPickerMapProps) {
  return (
    <MapsProvider fallback={(reason) => <MapUnavailable reason={reason} compact />}>
      <PickerMap {...props} />
    </MapsProvider>
  );
}
