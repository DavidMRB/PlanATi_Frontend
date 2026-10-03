import { Compass } from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#4c4cdd] text-white shadow-[0_8px_18px_rgba(76,76,221,0.24)]">
        <Compass aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="text-sm font-bold tracking-[0.18em] text-[#17243d]">
          PLANATI
        </span>
      )}
    </div>
  );
}