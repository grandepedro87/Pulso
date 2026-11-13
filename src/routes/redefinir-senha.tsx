import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Pulso" },
      { name: "description", content: "Crie uma nova senha para sua conta Pulso." },
      { property: "og:title", content: "Redefinir senha — Pulso" },
      { property: "og:description", content: "Crie uma nova senha para sua conta Pulso." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecovery)) setReady("ok");
    });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady((r) => (r === "ok" ? r : data.session ? "ok" : "invalid"));
    }, 1200);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (pw !== pw2) return setError("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    toast.success("Senha atualizada!");
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">Nova senha</h1>
          {ready === "checking" ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Validando link…</p>
          ) : ready === "invalid" ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Este link é inválido ou expirou. Solicite um novo.</p>
              <Button asChild variant="hero"><Link to="/auth" search={{ mode: "forgot" }}>Solicitar novo link</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="pw">Nova senha</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
              <div className="space-y-1.5"><Label htmlFor="pw2">Confirmar senha</Label><Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}Salvar nova senha</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
