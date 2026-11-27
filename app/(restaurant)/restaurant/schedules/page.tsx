"use client";

import SchedulesEditor from "@/components/establishment-management/SchedulesEditor";
import { getSchedules, putSchedules } from "@/lib/restaurant-api";

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

export default function RestaurantSchedulesPage() {
  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-4 sm:p-6`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-72 rounded-full bg-[#5df0dc]/25 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Atención al público</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Horarios de atención</h1>
          <p className="max-w-2xl text-sm text-[#43506a] sm:text-base">
            Define hasta tres tramos por día en hora de Colombia, incluso si el cierre es después de medianoche.
          </p>
        </div>
      </header>

      <SchedulesEditor load={getSchedules} save={putSchedules} showWeekPreview />
    </div>
  );
}
