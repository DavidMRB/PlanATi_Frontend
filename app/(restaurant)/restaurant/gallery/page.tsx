"use client";

import GalleryManager from "@/components/establishment-management/GalleryManager";
import { restaurantManagementApi } from "@/lib/management-api";

// El contenido vive en components/establishment-management/ para que el admin lo reutilice
// (/admin/establishments/[id]/manage) con adminManagementApi.
export default function RestaurantGalleryPage() {
  return <GalleryManager api={restaurantManagementApi} />;
}
