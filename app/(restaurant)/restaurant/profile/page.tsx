"use client";

import ProfileEditor from "@/components/establishment-management/ProfileEditor";
import { restaurantManagementApi } from "@/lib/management-api";

// El contenido vive en components/establishment-management/ para que el admin lo reutilice
// (/admin/establishments/[id]/manage) con adminManagementApi.
export default function RestaurantProfilePage() {
  return <ProfileEditor api={restaurantManagementApi} />;
}
