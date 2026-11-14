"use client";

import ProductsManager from "@/components/establishment-management/ProductsManager";
import { restaurantManagementApi } from "@/lib/management-api";

// El contenido vive en components/establishment-management/ para que el admin lo reutilice
// (/admin/establishments/[id]/manage) con adminManagementApi.
export default function RestaurantProductsPage() {
  return <ProductsManager api={restaurantManagementApi} />;
}
