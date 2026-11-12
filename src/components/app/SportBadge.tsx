import { getSport } from "@/lib/sports";
import { cn } from "@/lib/utils";

export function SportBadge({ sport, className }: { sport: string; className?: string }) {
  const s = getSport(sport);
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {s.label}
    </span>
  );
}
