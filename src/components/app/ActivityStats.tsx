import { Repeat, Route as RouteIcon, Timer, Layers } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/sports";

export function ActivityStats({
  duration,
  distance,
  sets,
  reps,
}: {
  duration: number;
  distance: number | null;
  sets: number | null;
  reps: number | null;
}) {
  const items = [
    { icon: Timer, label: "Duração", value: formatDuration(duration) },
    distance != null ? { icon: RouteIcon, label: "Distância", value: formatDistance(Number(distance)) } : null,
    sets != null ? { icon: Layers, label: "Séries", value: String(sets) } : null,
    reps != null ? { icon: Repeat, label: "Repetições", value: String(reps) } : null,
  ].filter(Boolean) as { icon: typeof Timer; label: string; value: string }[];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <it.icon className="size-3.5" />
            {it.label}
          </div>
          <div className="mt-0.5 font-display text-sm font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
