"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/lib/auth-api";

type LogoutButtonProps = {
  className?: string;
};

// Cierre de sesión unificado: el backend borra la cookie; aquí se limpian
// los datos del navegador y se regresa a /login.
export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Aunque falle la petición, se sale de la vista para no dejar la sesión a medias.
    } finally {
      sessionStorage.clear();
      router.replace("/login");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#6d6e7a] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 ${className}`}
    >
      <LogOut aria-hidden="true" className="size-4" />
      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
