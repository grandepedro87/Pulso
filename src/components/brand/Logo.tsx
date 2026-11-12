import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-gradient-lime text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" strokeWidth={2.6} stroke="currentColor">
        <path d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">pulso</span>
    </span>
  );
}
