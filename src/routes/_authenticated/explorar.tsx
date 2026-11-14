import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchPosts } from "@/lib/feed";
import { SPORT_LIST, getSport } from "@/lib/sports";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/AppShell";
import { PostCard, PostSkeleton } from "@/components/app/PostCard";
import { EmptyState } from "@/components/app/EmptyState";
import { UserAvatar } from "@/components/app/UserAvatar";
import { FollowButton } from "@/components/app/FollowButton";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/explorar")({
  head: () => ({ meta: [{ title: "Explorar — Pulso" }, { name: "description", content: "Encontre atletas e atividades por modalidade." }, { property: "og:title", content: "Explorar — Pulso" }, { property: "og:description", content: "Encontre atletas e atividades por modalidade." }] }),
  component: Explore,
});

function Explore() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<string | null>(null);

  const people = useQuery({
    queryKey: ["people", q.trim()],
    queryFn: async () => {
      let req = supabase.from("profiles").select("id, display_name, avatar_url, sports").neq("id", user!.id).order("created_at", { ascending: false }).limit(12);
      const t = q.trim().replace(/[%_,()]/g, "");
      if (t) req = req.ilike("display_name", `%${t}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data;
    },
  });
  const posts = useQuery({ queryKey: ["posts", "explore", sport], queryFn: () => fetchPosts({ sport: sport ?? undefined }) });

  return (
    <div>
      <PageHeader title="Explorar" description="Descubra atletas e atividades da comunidade." />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar atletas pelo nome" className="h-11 pl-10" />
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="order-2 lg:order-1">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            <Chip active={!sport} onClick={() => setSport(null)}>Todas</Chip>
            {SPORT_LIST.map((s) => <Chip key={s.id} active={sport === s.id} onClick={() => setSport(s.id)}><s.icon className="size-4" />{s.label}</Chip>)}
          </div>
          <div className="mt-4 space-y-4">
            {posts.isLoading ? <PostSkeleton /> : posts.data?.length === 0 ? (
              <EmptyState icon={Search} title="Nenhuma publicação" description={sport ? `Ainda não há publicações de ${getSport(sport).label}.` : "Ainda não há publicações."} />
            ) : posts.data?.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
        <aside className="order-1 lg:order-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Atletas</h2>
          <div className="space-y-2">
            {people.isLoading ? <div className="h-16 animate-pulse rounded-xl bg-card" /> : people.data?.length === 0 ? (
              <EmptyState icon={Users} title="Ninguém encontrado" />
            ) : people.data?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <Link to="/perfil/$userId" params={{ userId: p.id }}><UserAvatar name={p.display_name} path={p.avatar_url} /></Link>
                <div className="min-w-0 flex-1">
                  <Link to="/perfil/$userId" params={{ userId: p.id }} className="block truncate text-sm font-semibold hover:text-primary">{p.display_name}</Link>
                  <p className="truncate text-xs text-muted-foreground">{p.sports.map((s) => getSport(s).label).join(" · ") || "Atleta"}</p>
                </div>
                <FollowButton targetId={p.id} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{children}</button>
  );
}
