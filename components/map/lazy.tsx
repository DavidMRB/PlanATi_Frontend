"use client";

import dynamic from "next/dynamic";

// Los mapas se cargan solo en el navegador y solo en las vistas que los usan, para no descargar el
// JavaScript de Google Maps (ni el de este código) en el resto de páginas.
function MapSkeleton() {
  return <div aria-hidden="true" className="size-full min-h-48 animate-pulse rounded-2xl bg-[#e9edff]" />;
}

export const EstablishmentsMap = dynamic(() => import("./EstablishmentsMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export const StaticLocationMap = dynamic(() => import("./StaticLocationMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: MapSkeleton,
});
