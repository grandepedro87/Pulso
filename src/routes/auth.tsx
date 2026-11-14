import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialButtons } from "@/components/app/SocialButtons";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined; redirect?: string | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? s["mode"] : undefined,
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Pulso" },
      { name: "description", content: "Acesse sua conta Pulso ou cadastre-se para entrar na comunidade esportiva." },
      { property: "og:title", content: "Entrar no Pulso" },
      { property: "og:description", content: "Acesse ou crie sua conta na comunidade esportiva Pulso." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/inicio";
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return "/inicio";
    return u.pathname + u.search;
  } catch {
    return "/inicio";
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ href: safePath(search.redirect), replace: true });
  }, [user, loading, navigate, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Informe um e-mail válido.");
    if (mode !== "forgot" && password.length < 8 && mode === "signup")
      return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Informe seu nome.");
      if (password !== confirm) return setError("As senhas não coincidem.");
    }
    if (mode === "login" && !password) return setError("Informe sua senha.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent("Enviamos um link de confirmação para " + em + ". Confirme para entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        setSent("Se houver uma conta com " + em + ", você receberá um link para redefinir a senha.");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: "Entrar",
    signup: "Criar conta",
    forgot: "Recuperar senha",
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-md animate-fade-up">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">{titles[mode]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" && "Que bom te ver de novo."}
            {mode === "signup" && "Entre para a comunidade e registre seu primeiro treino."}
            {mode === "forgot" && "Enviaremos um link para você criar uma nova senha."}
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
              {sent}
              <Button variant="link" className="mt-2 h-auto p-0" onClick={() => { setSent(null); setMode("login"); }}>
                Voltar para entrar
              </Button>
            </div>
          ) : (
            <>
              {mode !== "forgot" ? (
                <>
                  <div className="mt-6"><SocialButtons /></div>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />ou com e-mail<span className="h-px flex-1 bg-border" />
                  </div>
                </>
              ) : <div className="mt-6" />}
              <form onSubmit={submit} className="space-y-4" noValidate>
                {mode === "signup" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                {mode !== "forgot" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      {mode === "login" ? (
                        <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>
                          Esqueci a senha
                        </button>
                      ) : null}
                    </div>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  </div>
                ) : null}
                {mode === "signup" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                  </div>
                ) : null}
                {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Ainda não tem conta? <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("signup"); setError(null); }}>Criar conta</button></>
            ) : (
              <>Já tem conta? <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("login"); setError(null); setSent(null); }}>Entrar</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
