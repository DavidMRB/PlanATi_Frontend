"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import { AlertCircle, Loader2, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GeoPosition } from "@/hooks/useGeolocation";
import { getMapMarkers, type EstablishmentFilters, type MapMarker, type MapMarkersResponse } from "@/lib/establishments-api";
import type { Bounds } from "@/lib/geo";
import { mapsConfig } from "@/lib/maps-config";
import EstablishmentMarker from "./EstablishmentMarker";
import MapsProvider from "./MapsProvider";
import UserLocationMarker from "./UserLocationMarker";

// Recargar marcadores solo cuando la cámara se detiene (evento idle) y tras esta espera.
const IDLE_DEBOUNCE_MS = 400;
// Con más marcadores que esto se agrupan; con pocos se ven todos sueltos.
const CLUSTER_THRESHOLD = 40;
const USER_ZOOM = 15;

export type EstablishmentsMapProps = {
  filters: EstablishmentFilters;
  userPosition: GeoPosition | null;
  // Marcador resaltado (tarjeta con el cursor encima) o elegido.
  activeId: number | null;
  selected: MapMarker | null;
  onSelect: (marker: MapMarker | null) => void;
  onHover?: (id: number | null) => void;
  // En escritorio el detalle del marcador va en un InfoWindow; en móvil lo pinta la página (hoja inferior).
  renderInfo?: (marker: MapMarker) => ReactNode;
  className?: string;
};

function readBounds(map: google.maps.Map): Bounds | null {
  const literal = map.getBounds()?.toJSON();
  if (!literal) return null;
  const { north, south, east, west } = literal;
  // Un área que cruza el antimeridiano (oeste > este) no aplica en Colombia; se ignora.
  if (!(south < north && west < east)) return null;
  return { north, south, east, west };
}

function DirectoryMap({ filters, userPosition, activeId, selected, onSelect, onHover, renderInfo }: EstablishmentsMapProps) {
  const map = useMap();
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [data, setData] = useState<MapMarkersResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const idleTimer = useRef<number | undefined>(undefined);

  const handleIdle = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (map) setBounds(readBounds(map));
    }, IDLE_DEBOUNCE_MS);
  }, [map]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // Los filtros llegan como objeto nuevo en cada render: se comparan por su contenido.
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filtersKey) as EstablishmentFilters, [filtersKey]);

  useEffect(() => {
    if (!bounds) return;
    const controller = new AbortController();
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) setStatus("loading");
    });
    getMapMarkers(bounds, stableFilters, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response ?? { items: [], truncated: false });
        setStatus("idle");
      })
      .catch(() => {
        // Una petición cancelada (el mapa se movió otra vez) no es un error.
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [bounds, stableFilters]);

  // Centrar una vez en el usuario cuando llega su ubicación después de montar el mapa.
  const centeredOnUser = useRef(false);
  useEffect(() => {
    if (!map || !userPosition || centeredOnUser.current) return;
    centeredOnUser.current = true;
    map.panTo({ lat: userPosition.lat, lng: userPosition.lng });
    if ((map.getZoom() ?? 0) < USER_ZOOM - 1) map.setZoom(USER_ZOOM - 1);
  }, [map, userPosition]);

  const markers = useMemo(() => data?.items ?? [], [data]);
  const clusterEnabled = markers.length > CLUSTER_THRESHOLD;

  // Agrupador: se crea solo cuando hacen falta grupos y se retira al dejar de usarse.
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);
  useEffect(() => {
    if (!map || !clusterEnabled) return;
    const instance = new MarkerClusterer({ map });
    let current = true;
    void Promise.resolve().then(() => {
      if (current) setClusterer(instance);
    });
    return () => {
      current = false;
      instance.clearMarkers();
      instance.setMap(null);
      setClusterer(null);
    };
  }, [map, clusterEnabled]);

  const [markerElements, setMarkerElements] = useState<Record<number, google.maps.marker.AdvancedMarkerElement>>({});
  const registerMarker = useCallback((element: google.maps.marker.AdvancedMarkerElement | null, id: number) => {
    setMarkerElements((current) => {
      if ((element && current[id] === element) || (!element && !current[id])) return current;
      if (element) return { ...current, [id]: element };
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markerElements));
  }, [clusterer, markerElements]);

  const recenter = () => {
    if (!map || !userPosition) return;
    map.panTo({ lat: userPosition.lat, lng: userPosition.lng });
    map.setZoom(USER_ZOOM);
  };

  const initialCenter = userPosition ? { lat: userPosition.lat, lng: userPosition.lng } : mapsConfig.defaultCenter;

  return (
    <div className="relative size-full">
      <Map
        mapId={mapsConfig.mapId}
        defaultCenter={initialCenter}
        defaultZoom={userPosition ? USER_ZOOM - 1 : mapsConfig.defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onIdle={handleIdle}
        onClick={() => onSelect(null)}
        className="size-full"
      >
        {markers.map((marker) => (
          <EstablishmentMarker
            key={`${marker.id}-${clusterEnabled ? "c" : "s"}`}
            marker={marker}
            active={marker.id === activeId || marker.id === selected?.id}
            onSelect={onSelect}
            onHover={onHover}
            markerRef={clusterEnabled ? registerMarker : undefined}
          />
        ))}
        {userPosition && <UserLocationMarker position={userPosition} />}
        {selected && renderInfo && (
          <InfoWindow
            position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
            pixelOffset={[0, -40]}
            headerContent={<span className="text-sm font-bold text-[#17243d]">{selected.name}</span>}
            onCloseClick={() => onSelect(null)}
            shouldFocus={false}
          >
            {renderInfo(selected)}
          </InfoWindow>
        )}
      </Map>

      <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-3">
        {status === "loading" && (
          <span className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#43506a] shadow">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            Cargando lugares...
          </span>
        )}
        {status === "error" && (
          <span role="alert" className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-600 shadow">
            <AlertCircle aria-hidden="true" className="size-3.5" />
            No pudimos cargar los lugares de esta zona.
          </span>
        )}
        {status === "idle" && data?.truncated && (
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-[#43506a] shadow">
            Hay más lugares en esta zona: acerca el mapa para verlos todos.
          </span>
        )}
        {status === "idle" && data && data.items.length === 0 && (
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#43506a] shadow">
            No hay lugares en esta zona con esos filtros.
          </span>
        )}
      </div>

      {userPosition && (
        <button
          type="button"
          onClick={recenter}
          aria-label="Centrar el mapa en mi ubicación"
          title="Centrar en mi ubicación"
          className="absolute bottom-6 right-3 flex size-11 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-[0_4px_14px_rgba(23,36,61,0.25)] transition hover:bg-[#f3f5ff]"
        >
          <LocateFixed aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  );
}

// Mapa del directorio (/explore). Pide los marcadores del área visible a /establishments/map.
export default function EstablishmentsMap(props: EstablishmentsMapProps) {
  return (
    <div role="region" aria-label="Mapa de establecimientos" className={props.className ?? "size-full"}>
      <MapsProvider>
        <DirectoryMap {...props} />
      </MapsProvider>
    </div>
  );
}
