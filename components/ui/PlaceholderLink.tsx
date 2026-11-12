"use client";

import type { ComponentPropsWithoutRef } from "react";

// Enlace a una sección que todavía no existe (Planes, Favoritos, Horarios, Soporte, etc.).
// Apunta a "#" pero no navega ni sube la página: cuando la sección exista se cambia por un <Link> real
// o se quita. Buscar "PlaceholderLink" en el proyecto lista todos los destinos pendientes.
export default function PlaceholderLink({ children, onClick, ...props }: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      title="Próximamente"
      {...props}
      href="#"
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
