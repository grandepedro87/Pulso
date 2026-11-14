import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SPORT_LIST, fieldsForSport, isFieldRequired, isSportId, validateActivity, type ActivityErrors, type ActivityInput } from "@/lib/sports";
import { uploadImage } from "@/lib/storage";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/AppShell";
import { ImageInput } from "@/components/app/ImageInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/registrar")({
  head: () => ({ meta: [{ title: "Registrar atividade — Pulso" }, { name: "description", content: "Registre seu treino no Pulso." }, { property: "og:title", content: "Registrar atividade — Pulso" }, { property: "og:description", content: "Registre seu treino no Pulso." }] }),
  component: Register,
});

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function Register() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState<ActivityInput>({ sport: "", title: "", description: "", durationMinutes: "", date: today(), distanceKm: "", sets: "", reps: "" });
  const [errors, setErrors] = useState<ActivityErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ActivityInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const fields = isSportId(f.sport) ? fieldsForSport(f.sport) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = validateActivity(f, today());
    if (!r.ok) { setErrors(r.errors); toast.error("Revise os campos destacados."); return; }
    setErrors({});
    setBusy(true);
    try {
      const image_url = file ? await uploadImage(user!.id, file, "activities") : null;
      const { data, error } = await supabase.from("activities").insert({ ...r.payload, image_url, user_id: user!.id }).select("id").single();
      if (error) throw error;
      if (share) {
        const { error: pe } = await supabase.from("posts").insert({ user_id: user!.id, activity_id: data.id, sport: r.payload.sport, content: r.payload.description || r.payload.title, image_url });
        if (pe) toast.error("Atividade salva, mas não foi possível publicar no feed.");
      }
      toast.success(share ? "Atividade salva e compartilhada!" : "Atividade salva no seu histórico.");
      qc.invalidateQueries();
      navigate(share ? { to: "/inicio" } : { to: "/perfil/$userId", params: { userId: user!.id } });
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível salvar a atividade."));
    } finally { setBusy(false); }
  }

  const err = (k: keyof ActivityInput) => errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Registrar atividade" description="Os campos se ajustam à modalidade escolhida." />
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6" noValidate>
        <div className="space-y-2">
          <Label>Modalidade</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SPORT_LIST.map((s) => (
              <button type="button" key={s.id} onClick={() => setF({ ...f, sport: s.id })} className={cn("flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition", f.sport === s.id ? "border-primary bg-accent text-accent-foreground shadow-glow" : "border-border bg-surface/50 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
                <s.icon className="size-5" />{s.label}
              </button>
            ))}
          </div>
          {err("sport")}
        </div>
        <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" value={f.title} onChange={set("title")} maxLength={100} placeholder="Ex.: Longão de domingo" />{err("title")}</div>
        <div className="space-y-1.5"><Label htmlFor="desc">Descrição</Label><Textarea id="desc" value={f.description} onChange={set("description")} maxLength={1000} rows={3} placeholder="Como foi? Sensações, percurso, exercícios…" />{err("description")}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="dur">Duração (min)</Label><Input id="dur" inputMode="numeric" value={f.durationMinutes} onChange={set("durationMinutes")} placeholder="45" />{err("durationMinutes")}</div>
          <div className="space-y-1.5"><Label htmlFor="date">Data</Label><Input id="date" type="date" max={today()} value={f.date} onChange={set("date")} />{err("date")}</div>
          {fields.includes("distance") ? <div className="space-y-1.5 animate-fade-up"><Label htmlFor="dist">Distância (km){isSportId(f.sport) && !isFieldRequired(f.sport, "distance") ? " — opcional" : ""}</Label><Input id="dist" inputMode="decimal" value={f.distanceKm} onChange={set("distanceKm")} placeholder="5,0" />{err("distanceKm")}</div> : null}
          {fields.includes("sets") ? <div className="space-y-1.5 animate-fade-up"><Label htmlFor="sets">Séries</Label><Input id="sets" inputMode="numeric" value={f.sets} onChange={set("sets")} placeholder="4" />{err("sets")}</div> : null}
          {fields.includes("reps") ? <div className="space-y-1.5 animate-fade-up"><Label htmlFor="reps">Repetições</Label><Input id="reps" inputMode="numeric" value={f.reps} onChange={set("reps")} placeholder="12" />{err("reps")}</div> : null}
        </div>
        <ImageInput file={file} onChange={setFile} />
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 p-4">
          <span><span className="block text-sm font-semibold">Compartilhar no feed</span><span className="text-xs text-muted-foreground">A comunidade poderá curtir e comentar.</span></span>
          <Switch checked={share} onCheckedChange={setShare} />
        </label>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}Salvar atividade</Button>
      </form>
    </div>
  );
}
