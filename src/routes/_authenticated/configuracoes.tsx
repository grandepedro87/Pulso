import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut, useAuth, useMyProfile } from "@/lib/auth";
import { SPORT_LIST } from "@/lib/sports";
import { uploadImage, validateImage } from "@/lib/storage";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/AppShell";
import { UserAvatar } from "@/components/app/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Pulso" }, { name: "description", content: "Edite seu perfil e sua conta." }, { property: "og:title", content: "Configurações — Pulso" }, { property: "og:description", content: "Edite seu perfil e sua conta." }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [upBusy, setUpBusy] = useState(false);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile) { setName(profile.display_name); setBio(profile.bio ?? ""); setSports(profile.sports); setAvatar(profile.avatar_url); }
  }, [profile]);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const err = validateImage(f); if (err) return void toast.error(err);
    setUpBusy(true);
    try { setAvatar(await uploadImage(user!.id, f, "avatar")); toast.info("Foto carregada. Salve para aplicar."); }
    catch (er) { toast.error(friendlyError(er)); } finally { setUpBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 60) return void toast.error("O nome deve ter entre 2 e 60 caracteres.");
    if (bio.length > 280) return void toast.error("A bio deve ter no máximo 280 caracteres.");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: n, bio: bio.trim() || null, sports, avatar_url: avatar }).eq("id", user!.id);
    setBusy(false);
    if (error) return void toast.error(friendlyError(error));
    toast.success("Perfil atualizado!");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["posts"] });
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return void toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    if (pw !== pw2) return void toast.error("As senhas não coincidem.");
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, ...(cur ? { current_password: cur } : {}) });
    setPwBusy(false);
    if (error) return void toast.error(friendlyError(error));
    toast.success("Senha alterada!"); setCur(""); setPw(""); setPw2("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Configurações" description="Seu perfil esportivo e sua conta." />
      <form onSubmit={save} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <div className="flex items-center gap-4">
          <UserAvatar name={name} path={avatar} className="size-20" />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-primary/50">
            {upBusy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Trocar foto
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onAvatar} />
          </label>
        </div>
        <div className="space-y-1.5"><Label htmlFor="n">Nome</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
        <div className="space-y-1.5"><Label htmlFor="b">Biografia</Label><Textarea id="b" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} placeholder="Conte um pouco sobre você e seus objetivos." /><p className="text-right text-xs text-muted-foreground">{bio.length}/280</p></div>
        <div className="space-y-2">
          <Label>Modalidades praticadas</Label>
          <div className="flex flex-wrap gap-2">
            {SPORT_LIST.map((s) => { const on = sports.includes(s.id); return (
              <button type="button" key={s.id} onClick={() => setSports(on ? sports.filter((x) => x !== s.id) : [...sports, s.id])} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition", on ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}><s.icon className="size-4" />{s.label}</button>
            ); })}
          </div>
        </div>
        <Button type="submit" disabled={busy || upBusy}>{busy ? <Loader2 className="animate-spin" /> : null}Salvar perfil</Button>
      </form>

      <form onSubmit={changePw} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Alterar senha</h2>
        <p className="text-xs text-muted-foreground">Se você entrou com Google ou Lovable, não é preciso definir senha.</p>
        <div className="space-y-1.5"><Label htmlFor="c">Senha atual</Label><Input id="c" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="p1">Nova senha</Label><Input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
          <div className="space-y-1.5"><Label htmlFor="p2">Confirmar nova senha</Label><Input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
        </div>
        <Button type="submit" variant="secondary" disabled={pwBusy}>{pwBusy ? <Loader2 className="animate-spin" /> : null}Alterar senha</Button>
      </form>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div><p className="font-semibold">Sair da conta</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
        <Button variant="destructive" onClick={async () => { await signOut(qc); navigate({ to: "/auth", replace: true }); }}><LogOut /> Sair</Button>
      </div>
    </div>
  );
}
