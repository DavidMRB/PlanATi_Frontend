import { useEffect, type RefObject } from "react";

// Cierra un menú o ventana flotante al hacer clic fuera de ella o al pulsar Escape.
export function useDismiss(open: boolean, onDismiss: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onDismiss, ref]);
}
