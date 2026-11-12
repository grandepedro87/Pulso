import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { validateImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function ImageInput({
  file,
  onChange,
  className,
  label = "Adicionar foto (opcional)",
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className={className}>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const err = validateImage(f);
          if (err) return void toast.error(err);
          onChange(f);
        }}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <img src={preview} alt="Pré-visualização" className="max-h-80 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
            aria-label="Remover imagem"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground",
          )}
        >
          <ImagePlus className="size-5" />
          {label}
        </button>
      )}
    </div>
  );
}
