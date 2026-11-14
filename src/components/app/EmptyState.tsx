import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
