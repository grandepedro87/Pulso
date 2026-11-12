import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function UserAvatar({
  name,
  path,
  className,
}: {
  name?: string | null;
  path?: string | null;
  className?: string;
}) {
  const url = useMediaUrl(path);
  return (
    <Avatar className={cn("size-10 ring-1 ring-border", className)}>
      {url ? <AvatarImage src={url} alt={name ?? "Foto de perfil"} className="object-cover" /> : null}
      <AvatarFallback className="bg-accent font-display text-xs font-semibold text-accent-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
