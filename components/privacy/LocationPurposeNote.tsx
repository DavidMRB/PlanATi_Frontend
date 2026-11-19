import { ShieldCheck } from "lucide-react";

type LocationPurposeNoteProps = {
  // "user": junto a "Usar mi ubicación" / "Cerca de mí"; "establishment": en el selector del local.
  variant?: "user" | "establishment";
  className?: string;
};

const TEXT = {
  user: "Usamos tu ubicación solo para mostrarte lugares cercanos; no la guardamos.",
  establishment: "La ubicación de tu local será pública en el mapa.",
} as const;

// Para qué se usa la ubicación, antes de pedir el permiso del navegador (Ley 1581 de 2012).
export default function LocationPurposeNote({ variant = "user", className = "" }: LocationPurposeNoteProps) {
  return (
    <p className={`flex items-start gap-1.5 text-xs text-[#6d6e7a] ${className}`}>
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[#0b6b5c]" />
      {TEXT[variant]}
    </p>
  );
}
