"use client";

import { usePathname } from "next/navigation";
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
import { AUTH_ENDPOINTS, getAuthRequest, type UserProfile } from "@/lib/auth-api";

type AuthContextValue = {
  // undefined mientras se consulta la sesión; null si no hay sesión; el perfil si la hay.
  user: UserProfile | null | undefined;
  isLoading: boolean;
  // Vuelve a consultar /users/me (p. ej. tras editar el perfil).
  refresh: () => Promise<void>;
  // Olvida la sesión en el cliente (el backend borra la cookie en el logout).
  clear: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Una sola consulta de sesión para toda la aplicación. Los layouts por rol (admin, restaurante)
// y el Navbar leen el rol de aquí en vez de pedir /users/me cada uno por su cuenta.
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const profile = await getAuthRequest<UserProfile>(AUTH_ENDPOINTS.profile);
      if (current === requestId.current) setUser(profile ?? null);
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
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading: user === undefined, refresh: load, clear }),
    [user, load, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return context;
}
