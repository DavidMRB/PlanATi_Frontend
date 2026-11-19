import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  // Botón o enlace opcional (p. ej. "Explorar lugares").
  action?: ReactNode;
  className?: string;
};

// Estado vacío con un texto útil: qué pasa y qué puede hacer la persona.
export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-3xl bg-[#f3f5ff] px-6 py-10 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#514ddd] shadow-[0_4px_14px_rgba(23,36,61,0.08)]">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="text-base font-bold text-[#17243d]">{title}</p>
      {description && <div className="max-w-sm text-sm text-[#6d6e7a]">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
