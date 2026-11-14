import { PLAN_STATUS_LABEL, type PlanStatus } from "@/lib/plans-api";

const STATUS_CLASS: Record<PlanStatus, string> = {
  SCHEDULED: "bg-[#eef0ff] text-[#514ddd]",
  CANCELLED: "bg-slate-200 text-slate-600",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[status]}`}>
      {PLAN_STATUS_LABEL[status]}
    </span>
  );
}
