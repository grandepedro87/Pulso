import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, CalendarDays, Pencil, Share2, Trash2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchPosts } from "@/lib/feed";
import { formatDistance, formatDuration, getSport } from "@/lib/sports";
import { friendlyError } from "@/lib/errors";
import { useMediaUrl } from "@/lib/storage";
import { PostCard, PostSkeleton } from "@/components/app/PostCard";
import { EmptyState } from "@/components/app/EmptyState";
import { UserAvatar } from "@/components/app/UserAvatar";
import { SportBadge } from "@/components/app/SportBadge";
import { FollowButton } from "@/components/app/FollowButton";
import { ActivityStats } from "@/components/app/ActivityStats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/perfil/$userId")({
  head: () => ({ meta: [{ title: "Perfil — Pulso" }, { name: "description", content: "Perfil esportivo na comunidade Pulso." }, { property: "og:title", content: "Perfil — Pulso" }, { property: "og:description", content: "Perfil esportivo na comunidade Pulso." }] }),
  component: ProfilePage,
});

interface ActivityRow { id: string; sport: string; title: string; description: string | null; duration_minutes: number; activity_date: string; distance_km: number | null; sets: number | null; reps: number | null; image_url: string | null }

function ProfilePage() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const isMe = user?.id === userId;

  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_url, bio, sports, created_at").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const stats = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      const c = (t: "posts" | "follows" | "activities", col: string) => supabase.from(t).select("*", { count: "exact", head: true }).eq(col, userId);
      const [p, fr, fg] = await Promise.all([c("posts", "user_id"), c("follows", "following_id"), c("follows", "follower_id")]);
      return { posts: p.count ?? 0, followers: fr.count ?? 0, following: fg.count ?? 0 };
    },
  });
  const activities = useQuery({
    queryKey: ["activities", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").eq("user_id", userId).order("activity_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActivityRow[];
    },
  });
  const sharedIds = useQuery({
    queryKey: ["posts", "shared-activities", userId],
    enabled: isMe,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("activity_id").eq("user_id", userId).not("activity_id", "is", null);
      return new Set((data ?? []).map((r) => r.activity_id as string));
    },
  });
  const posts = useQuery({ queryKey: ["posts", "user", userId], queryFn: () => fetchPosts({ userId }) });

  if (profile.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-card" />;
  if (!profile.data) return <EmptyState icon={Activity} title="Perfil não encontrado" action={<Button asChild><Link to="/inicio">Voltar ao início</Link></Button>} />;
  const p = profile.data;
  const acts = activities.data ?? [];
  const totalMin = acts.reduce((s, a) => s + a.duration_minutes, 0);
  const totalKm = acts.reduce((s, a) => s + Number(a.distance_km ?? 0), 0);

  // last 8 weeks minutes
  const weeks = Array.from({ length: 8 }, (_, i) => startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 }));
  const chart = weeks.map((w, i) => {
    const end = weeks[i + 1] ?? new Date(8640000000000000);
    const min = acts.filter((a) => { const d = new Date(a.activity_date + "T12:00:00"); return d >= w && d < end; }).reduce((s, a) => s + a.duration_minutes, 0);
    return { semana: format(w, "dd/MM"), minutos: min };
  });

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <UserAvatar name={p.display_name} path={p.avatar_url} className="size-24 ring-2 ring-primary/50" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{p.display_name}</h1>
              {isMe ? <Button asChild variant="glass" size="sm"><Link to="/configuracoes"><Pencil /> Editar perfil</Link></Button> : <FollowButton targetId={p.id} />}
            </div>
            {p.bio ? <p className="mt-2 max-w-xl text-sm text-muted-foreground">{p.bio}</p> : isMe ? <p className="mt-2 text-sm text-muted-foreground">Adicione uma bio nas configurações.</p> : null}
            {p.sports.length ? <div className="mt-3 flex flex-wrap gap-2">{p.sports.map((s) => <SportBadge key={s} sport={s} />)}</div> : null}
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[["Publicações", stats.data?.posts], ["Seguidores", stats.data?.followers], ["Seguindo", stats.data?.following], ["Atividades", acts.length], ["Tempo total", formatDuration(totalMin)], ["Distância", formatDistance(Math.round(totalKm * 10) / 10)]].map(([l, v]) => (
            <div key={l as string} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="font-display text-lg font-bold">{v ?? "–"}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <Tabs defaultValue="posts" className="mt-8">
        <TabsList><TabsTrigger value="posts">Publicações</TabsTrigger><TabsTrigger value="atividades">Atividades</TabsTrigger></TabsList>
        <TabsContent value="posts" className="mx-auto mt-4 max-w-2xl space-y-4">
          {posts.isLoading ? <PostSkeleton /> : posts.data?.length === 0 ? <EmptyState icon={Activity} title="Nenhuma publicação ainda" /> : posts.data?.map((x) => <PostCard key={x.id} post={x} />)}
        </TabsContent>
        <TabsContent value="atividades" className="mt-4 space-y-4">
          {acts.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Minutos por semana</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}><XAxis dataKey="semana" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "var(--surface)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /><Bar dataKey="minutos" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
          {activities.isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-card" /> : acts.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhuma atividade registrada" description={isMe ? "Registre seu primeiro treino para começar seu histórico." : undefined} action={isMe ? <Button asChild variant="hero"><Link to="/registrar">Registrar atividade</Link></Button> : undefined} />
          ) : acts.map((a) => <ActivityCard key={a.id} a={a} isMe={isMe} shared={sharedIds.data?.has(a.id) ?? true} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityCard({ a, isMe, shared }: { a: ActivityRow; isMe: boolean; shared: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const img = useMediaUrl(a.image_url);
  const Icon = getSport(a.sport).icon;
  const share = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").insert({ user_id: user!.id, activity_id: a.id, sport: a.sport, content: a.description || a.title, image_url: a.image_url });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Compartilhada no feed!"); qc.invalidateQueries({ queryKey: ["posts"] }); qc.invalidateQueries({ queryKey: ["profile-stats"] }); },
    onError: (e) => toast.error(friendlyError(e)),
  });
  const del = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("activities").delete().eq("id", a.id); if (error) throw error; },
    onSuccess: () => { toast.success("Atividade excluída."); qc.invalidateQueries({ queryKey: ["activities"] }); },
    onError: (e) => toast.error(friendlyError(e)),
  });
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row">
      {img ? <img src={img} alt="" className="h-32 w-full rounded-xl object-cover sm:w-40" /> : <div className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><Icon className="size-6" /></div>}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-semibold">{a.title}</h3>
          <SportBadge sport={a.sport} />
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{format(new Date(a.activity_date + "T12:00:00"), "d 'de' MMM yyyy", { locale: ptBR })}</span>
        </div>
        {a.description ? <p className="text-sm text-muted-foreground">{a.description}</p> : null}
        <ActivityStats duration={a.duration_minutes} distance={a.distance_km} sets={a.sets} reps={a.reps} />
        {isMe ? (
          <div className="flex gap-2">
            {!shared ? <Button size="sm" variant="soft" onClick={() => share.mutate()} disabled={share.isPending}><Share2 /> Compartilhar no feed</Button> : null}
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("Excluir esta atividade?")) del.mutate(); }}><Trash2 /> Excluir</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
