import { CalendarDays, MapPin, Users } from "lucide-react";
import { formatCop } from "@/lib/format";
import type { ReactNode } from "react";

export type SummaryLine = { id: number; name: string; quantity: number; unitPrice: number };

type PlanSummaryProps = {
  establishmentName: string;
  when: string | null;
  partySize: number;
  lines: SummaryLine[];
  // Botón principal del paso (en móvil va en la barra inferior fija).
  action?: ReactNode;
};

export function summaryTotal(lines: SummaryLine[]): number {
  return lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
}

// Resumen del asistente: en escritorio una columna fija; en móvil, una barra inferior con el total.
export default function PlanSummary({ establishmentName, when, partySize, lines, action }: PlanSummaryProps) {
  const total = summaryTotal(lines);
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      <aside className="hidden space-y-4 rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(23,36,61,0.06)] lg:sticky lg:top-24 lg:block">
        <h2 className="text-lg font-extrabold text-[#17243d]">Resumen</h2>
        <ul className="space-y-2 text-sm text-[#43506a]">
          <li className="flex items-start gap-2">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
            {establishmentName}
          </li>
          <li className="flex items-start gap-2 first-letter:uppercase">
            <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
            {when ?? "Sin fecha elegida"}
          </li>
          <li className="flex items-start gap-2">
            <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#514ddd]" />
            {partySize} {partySize === 1 ? "persona" : "personas"}
          </li>
        </ul>
        {lines.length > 0 && (
          <ul className="space-y-1.5 border-t border-[#eceef7] pt-3 text-sm">
            {lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-[#43506a]">
                  {line.quantity}× {line.name}
                </span>
                <span className="shrink-0 font-semibold">{formatCop(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-baseline justify-between border-t border-[#eceef7] pt-3">
          <span className="text-sm font-semibold text-[#43506a]">Total estimado</span>
          <span className="text-xl font-extrabold text-[#514ddd]">{formatCop(total)}</span>
        </div>
        <p className="text-xs leading-5 text-[#6d6e7a]">El total es estimado; el establecimiento puede cambiar sus precios.</p>
        {action}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e4e6f0] bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#6d6e7a]">
              {units > 0 ? `${units} ${units === 1 ? "plato" : "platos"} · ` : ""}Total estimado
            </p>
            <p className="text-lg font-extrabold text-[#514ddd]">{formatCop(total)}</p>
          </div>
          {action}
        </div>
      </div>
    </>
  );
}
