"use client";

import SchedulesEditor from "@/components/establishment-management/SchedulesEditor";
import { getSchedules, putSchedules } from "@/lib/restaurant-api";

const card = "rounded-3xl bg-white shadow-[0_8px_24px_rgba(23,36,61,0.06)]";

export default function RestaurantSchedulesPage() {
  return (
    <div className="space-y-6">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div aria-hidden="true" className="absolute -right-10 -top-16 size-72 rounded-full bg-[#5df0dc]/25 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#514ddd]">Atención al público</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Horarios de apertura</h1>
          <p className="max-w-2xl text-base text-[#43506a]">
            Indica cuándo abres cada día, en hora de Colombia. Puedes dividir un día en hasta tres tramos (por ejemplo,
            almuerzo y cena) y marcar cierres después de la medianoche.
          </p>
        </div>
      </header>

      <SchedulesEditor load={getSchedules} save={putSchedules} />
    </div>
  );
}
