import { HelpCircle } from "lucide-react";

// "¿Qué acción usar?" (tabla de la sección 7.5 del plan del backend).
const ROWS: Array<[string, string]> = [
  ["Insultos, groserías, datos personales de terceros, enlaces o publicidad dentro de una opinión real", "Bloquear comentario"],
  ["Solo una foto es inapropiada", "Quitar imagen"],
  ["Reseña falsa, spam, cuenta que reseña sin haber ido, reseña duplicada con otra cuenta", "Ocultar reseña"],
  ["Contenido ilegal que no debe quedar ni en la base de datos", "Eliminar reseña"],
  ["Reincidencia", "Además, suspender al autor"],
];

export default function ModerationHelp() {
  return (
    <details className="group rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(23,36,61,0.06)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-[#514ddd]">
        <HelpCircle aria-hidden="true" className="size-4" />
        ¿Qué acción usar?
      </summary>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-[#6d6e7a]">
          <tr>
            <th className="pb-2 pr-4 font-semibold">Situación</th>
            <th className="pb-2 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f2f8]">
          {ROWS.map(([situation, action]) => (
            <tr key={action}>
              <td className="py-2 pr-4 text-[#43506a]">{situation}</td>
              <td className="py-2 font-semibold">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-[#6d6e7a]">
        Bloquear un comentario no cambia el promedio (las estrellas siguen contando); ocultar o eliminar la reseña sí.
      </p>
    </details>
  );
}
