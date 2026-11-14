import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Activity, Heart, MessageCircle, ShieldCheck, Users, FileText } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/auth";
import { fetchPosts } from "@/lib/feed";
import { PageHeader } from "@/components/app/AppShell";
import { PostCard, PostSkeleton } from "@/components/app/PostCard";
import { UserAvatar } from "@/components/app/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    if (!(await checkIsAdmin(context.user.id))) throw redirect({ to: "/inicio" });
  },
  head: () => ({ meta: [{ title: "Painel administrativo — Pulso" }, { name: "description", content: "Gestão da comunidade Pulso." }, { property: "og:title", content: "Painel administrativo — Pulso" }, { property: "og:description", content: "Gestão da comunidade Pulso." }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const metrics = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: async () => {
      const c = (t: "profiles" | "posts" | "activities" | "comments" | "likes") => supabase.from(t).select("*", { count: "exact", head: true });
      const since = subDays(new Date(), 13); since.setHours(0, 0, 0, 0);
      const [u, p, a, cm, l, recent] = await Promise.all([c("profiles"), c("posts"), c("activities"), c("comments"), c("likes"), supabase.from("posts").select("created_at").gte("created_at", since.toISOString())]);
      const days = Array.from({ length: 14 }, (_, i) => { const d = subDays(new Date(), 13 - i); return { key: format(d, "yyyy-MM-dd"), dia: format(d, "dd/MM"), publicações: 0 }; });
      (recent.data ?? []).forEach((r) => { const k = format(new Date(r.created_at), "yyyy-MM-dd"); const d = days.find((x) => x.key === k); if (d) d.publicações++; });
      return { users: u.count ?? 0, posts: p.count ?? 0, activities: a.count ?? 0, comments: cm.count ?? 0, likes: l.count ?? 0, days };
    },
  });
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: async () => { const { data, error } = await supabase.rpc("admin_list_users"); if (error) throw error; return data; } });
  const posts = useQuery({ queryKey: ["posts", "admin"], queryFn: () => fetchPosts({ limit: 100 }) });
  const m = metrics.data;
  const cards = [["Usuários", m?.users, Users], ["Publicações", m?.posts, FileText], ["Atividades", m?.activities, Activity], ["Comentários", m?.comments, MessageCircle], ["Curtidas", m?.likes, Heart]] as const;

  return (
    <div>
      <PageHeader title="Painel administrativo" description="Indicadores e moderação da comunidade." action={<Badge variant="outline" className="gap-1 border-primary/40 text-primary"><ShieldCheck className="size-3.5" /> Administrador</Badge>} />
      <Tabs defaultValue="geral">
        <TabsList><TabsTrigger value="geral">Visão geral</TabsTrigger><TabsTrigger value="usuarios">Usuários</TabsTrigger><TabsTrigger value="posts">Publicações</TabsTrigger></TabsList>
        <TabsContent value="geral" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {cards.map(([l, v, I]) => <div key={l} className="rounded-2xl border border-border bg-card p-4"><I className="size-5 text-primary" /><div className="mt-3 font-display text-2xl font-bold">{v ?? "–"}</div><div className="text-xs text-muted-foreground">{l}</div></div>)}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">Publicações nos últimos 14 dias</h3>
            <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={m?.days ?? []}><XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "var(--surface)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /><Bar dataKey="publicações" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Usuário</th><th className="p-3">E-mail</th><th className="p-3">Cadastro</th><th className="p-3">Publ.</th><th className="p-3">Ativ.</th></tr></thead>
              <tbody>
                {users.isLoading ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Carregando…</td></tr> : users.isError ? <tr><td className="p-4 text-destructive" colSpan={5}>Não foi possível carregar os usuários.</td></tr> : users.data?.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-3"><Link to="/perfil/$userId" params={{ userId: u.id }} className="flex items-center gap-2 font-semibold hover:text-primary"><UserAvatar name={u.display_name} path={u.avatar_url} className="size-8" />{u.display_name}{u.is_admin ? <Badge variant="outline" className="border-primary/40 text-primary">admin</Badge> : null}</Link></td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(u.created_at), "dd/MM/yyyy")}</td>
                    <td className="p-3">{u.posts_count}</td><td className="p-3">{u.activities_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="posts" className="mx-auto mt-4 max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground">Use o menu de cada publicação para excluir conteúdo inadequado.</p>
          {posts.isLoading ? <PostSkeleton /> : posts.data?.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma publicação.</p> : posts.data?.map((p) => <PostCard key={p.id} post={p} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
