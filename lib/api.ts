// Base de la API. Las peticiones pasan por los helpers de lib/auth-api.ts (cookie de sesión y token CSRF).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Respuesta paginada común de los endpoints nuevos (`Page[T]` en el backend).
export type Page<T> = {
  items: T[];
  total: number;
  skip: number;
  limit: number;
};
