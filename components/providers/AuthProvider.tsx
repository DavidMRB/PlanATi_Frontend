"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ACCOUNT_SUSPENDED_EVENT, AUTH_ENDPOINTS, getAuthRequest, type UserProfile } from "@/lib/auth-api";
import { clearCsrfToken, getCsrfToken, refreshCsrfToken } from "@/lib/csrf";

type AuthContextValue = {
  // undefined mientras se consulta la sesión; null si no hay sesión; el perfil si la hay.
  user: UserProfile | null | undefined;
  isLoading: boolean;
  // Vuelve a consultar /users/me (p. ej. tras editar el perfil).
  refresh: () => Promise<void>;
  // Olvida la sesión en el cliente (el backend borra la cookie en el logout).
  clear: () => void;
  // Cuenta suspendida (403 ACCOUNT_SUSPENDED en cualquier petición): motivo para /account-suspended.
  suspended: { reason: string | null } | null;
};

export const ACCOUNT_SUSPENDED_PATH = "/account-suspended";

// Rutas que una cuenta suspendida puede seguir viendo (para leer las normas y los textos legales).
function allowedWhileSuspended(pathname: string) {
  return pathname === ACCOUNT_SUSPENDED_PATH || pathname.startsWith("/legal/");
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Una sola consulta de sesión para toda la aplicación. Los layouts por rol (admin, restaurante)
// y el Navbar leen el rol de aquí en vez de pedir /users/me cada uno por su cuenta.
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [suspended, setSuspended] = useState<{ reason: string | null } | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const profile = await getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile);
      if (current !== requestId.current) return;
      // Con sesión abierta y sin token en memoria (la página se recargó), se pide el token CSRF
      // para que la primera escritura no tenga que reintentar.
      if (profile && !getCsrfToken()) void refreshCsrfToken();
      setUser(profile ?? null);
    } catch {
      // Sin sesión (401) o backend caído: se trata como visitante.
      if (current === requestId.current) setUser(null);
    }
  }, []);

  useEffect(() => {
    // El .then evita llamar setState de forma síncrona dentro del efecto.
    void Promise.resolve().then(load);
  }, [load]);

  // El proveedor no se vuelve a montar al navegar. Si no había sesión, al cambiar de ruta se vuelve a
  // consultar: así el login, el registro y el callback de Google se reflejan sin llamar a refresh().
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    if (userRef.current === null) void Promise.resolve().then(load);
  }, [pathname, load]);

  const clear = useCallback(() => {
    requestId.current += 1; // descarta consultas en vuelo
    clearCsrfToken();
    setUser(null);
    setSuspended(null);
  }, []);

  // lib/auth-api.ts emite el evento al recibir 403 ACCOUNT_SUSPENDED: la cookie sigue existiendo pero ya no
  // sirve, así que la sesión se trata como cerrada y se muestra el motivo.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const onSuspended = (event: Event) => {
      const reason = (event as CustomEvent<{ reason: string | null }>).detail?.reason ?? null;
      requestId.current += 1;
      clearCsrfToken();
      setUser(null);
      setSuspended((current) => (current && current.reason === reason ? current : { reason }));
      if (!allowedWhileSuspended(pathnameRef.current)) router.replace(ACCOUNT_SUSPENDED_PATH);
    };
    window.addEventListener(ACCOUNT_SUSPENDED_EVENT, onSuspended);
    return () => window.removeEventListener(ACCOUNT_SUSPENDED_EVENT, onSuspended);
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading: user === undefined, refresh: load, clear, suspended }),
    [user, load, clear, suspended],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return context;
}
