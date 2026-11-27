"use client";

import CombosManager from "@/components/establishment-management/CombosManager";
import ExcelExportButton from "@/components/ui/ExcelExportButton";
import { restaurantManagementApi } from "@/lib/management-api";

// El contenido vive en components/establishment-management/ para que el admin lo reutilice
// (/admin/establishments/[id]/manage) con adminManagementApi.
export default function RestaurantCombosPage() {
  return (
    <CombosManager api={restaurantManagementApi} exportAction={<ExcelExportButton filename="menu-planati.xlsx" path="/restaurant/exports/menu.xlsx" label="Exportar menú en Excel" />} />
  );
}
