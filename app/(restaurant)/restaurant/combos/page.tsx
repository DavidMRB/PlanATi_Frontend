"use client";

import CombosManager from "@/components/establishment-management/CombosManager";
import { restaurantManagementApi } from "@/lib/management-api";

// El contenido vive en components/establishment-management/ para que el admin lo reutilice
// (/admin/establishments/[id]/manage) con adminManagementApi.
export default function RestaurantCombosPage() {
  return <CombosManager api={restaurantManagementApi} />;
}
