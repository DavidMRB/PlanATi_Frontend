import { Bell, CalendarDays, MapPin, MessageSquarePlus, Users } from "lucide-react";
import Link from "next/link";
import { formatCop } from "@/lib/format";
import { formatPlanDate, REMINDER_LABEL, type PlanListItem } from "@/lib/plans-api";
import PlanStatusBadge from "./PlanStatusBadge";

// Tarjeta de un plan en la lista y en la agenda del calendario. Los cancelados se ven en gris; los
// completados ofrecen dejar la reseña (el detalle del local decide si aún se puede reseñar).
export default function PlanCard({ plan }: { plan: PlanListItem }) {
  const cancelled = plan.status === "CANCELLED";
  const total = Number(plan.total_amount);

  return (
    <article
      className={`rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(23,36,61,0.06)] ring-1 ring-[#eceef7] ${cancelled ? "opacity-60" : ""}`}
    >
      <Link href={`/plans/${plan.id}`} className="flex gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eef0ff] text-[#514ddd]">
          {plan.establishment.profile_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img src={plan.establishment.profile_image_url} alt="" className="size-full object-cover" />
          ) : (
            <CalendarDays aria-hidden="true" className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`min-w-0 truncate text-base font-bold text-[#17243d] ${cancelled ? "line-through" : ""}`}>
              {plan.title}
            </h3>
            <PlanStatusBadge status={plan.status} />
          </div>
          <p className="text-sm font-semibold first-letter:uppercase text-[#43506a]">{formatPlanDate(plan.scheduled_at)}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-[#6d6e7a]">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {plan.establishment.name}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6d6e7a]">
            <span className="flex items-center gap-1">
              <Users aria-hidden="true" className="size-3.5" />
              {plan.party_size} {plan.party_size === 1 ? "persona" : "personas"}
            </span>
            {total > 0 && <span className="font-semibold text-[#514ddd]">{formatCop(total)}</span>}
            {plan.status === "SCHEDULED" && plan.reminder_minutes_before && (
              <span className="flex items-center gap-1">
                <Bell aria-hidden="true" className="size-3.5" />
                {REMINDER_LABEL[plan.reminder_minutes_before]}
              </span>
            )}
          </p>
        </div>
      </Link>
      {plan.status === "COMPLETED" && (
        <Link
          href={`/establishments/${plan.establishment.id}?review=1#reviews`}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#e3f7f3] px-4 py-2.5 text-sm font-bold text-[#0b6b5c] hover:bg-[#d3f1eb]"
        >
          <MessageSquarePlus aria-hidden="true" className="size-4" />
          ¿Cómo te fue? Deja tu reseña
        </Link>
      )}
    </article>
  );
}
