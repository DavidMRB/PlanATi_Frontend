import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// La cookie la fija el backend (HttpOnly), así que aquí solo se comprueba que exista.
// La autorización real (rol y estado) la valida cada layout contra la API.
const SESSION_COOKIE = "access_token";

// Rutas bajo /restaurant que son públicas (registro de restaurantes).
const PUBLIC_PATHS = new Set(["/restaurant/register"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/restaurant/:path*", "/profile", "/notifications", "/plans/:path*", "/favorites"],
};
