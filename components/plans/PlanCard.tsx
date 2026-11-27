import { ArrowRight, Bell, CalendarDays, MapPin, MessageSquarePlus, Users } from "lucide-react";
import Link from "next/link";
import { formatCop } from "@/lib/format";
import { formatPlanDate, REMINDER_LABEL, type PlanListItem } from "@/lib/plans-api";
import PlanStatusBadge from "./PlanStatusBadge";

// Tarjeta de un plan en la lista y en la agenda del calendario. Los cancelados se ven en gris; los
// completados ofrecen dejar la reseña (el detalle del local decide si aún se puede reseñar).
export default function PlanCard({ plan, featured = false }: { plan: PlanListItem; featured?: boolean }) {
  const cancelled = plan.status === "CANCELLED";
  const total = Number(plan.total_amount);

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)] ring-1 ring-[#eceef7] ${featured ? "" : "p-4"} ${cancelled ? "opacity-60" : ""}`}
    >
      <Link href={`/plans/${plan.id}`} className={featured ? "grid min-w-0 sm:grid-cols-[minmax(7.5rem,2fr)_minmax(0,3fr)]" : "flex gap-4"}>
        <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#eef0ff] text-[#514ddd] ${featured ? "relative h-40 sm:h-full sm:min-h-44" : "size-14 rounded-xl"}`}>
          {plan.establishment.profile_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de R2
            <img src={plan.establishment.profile_image_url} alt="" className={featured ? "absolute inset-0 size-full object-cover" : "size-full object-cover"} />
          ) : (
            <CalendarDays aria-hidden="true" className="size-6" />
          )}
        </span>
        <div className={`min-w-0 flex-1 ${featured ? "space-y-2 p-4" : "space-y-1"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`min-w-0 font-bold text-[#17243d] ${featured ? "text-lg leading-tight" : "truncate text-base"} ${cancelled ? "line-through" : ""}`}>
              {plan.title}
            </h3>
            <PlanStatusBadge status={plan.status} />
          </div>
          <p className="text-sm font-semibold first-letter:uppercase text-[#43506a]">{formatPlanDate(plan.scheduled_at)}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-[#6d6e7a]">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {plan.establishment.name}
          </p>
          <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6d6e7a] ${featured ? "rounded-xl bg-[#eef2ff] px-3 py-2" : ""}`}>
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
          {featured && <span className="inline-flex items-center gap-2 rounded-lg bg-[#514ddd] px-3 py-2 text-xs font-bold text-white">Ver detalle <ArrowRight aria-hidden="true" className="size-3.5" /></span>}
        </div>
      </Link>
      {plan.status === "COMPLETED" && (
        <Link
          href={`/establishments/${plan.establishment.id}?review=1#reviews`}
          className={`mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#e3f7f3] px-4 py-2.5 text-sm font-bold text-[#0b6b5c] hover:bg-[#d3f1eb] ${featured ? "mx-4 mb-4" : ""}`}
        >
          <MessageSquarePlus aria-hidden="true" className="size-4" />
          ¿Cómo te fue? Deja tu reseña
        </Link>
      )}
    </article>
  );
}
