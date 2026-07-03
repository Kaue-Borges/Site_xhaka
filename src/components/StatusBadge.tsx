import { STATUS_META, type CityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusDot({ status, className }: { status: CityStatus; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", STATUS_META[status].dot, className)}
    />
  );
}

export function StatusBadge({ status }: { status: CityStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
      <StatusDot status={status} />
      {m.label}
    </span>
  );
}
