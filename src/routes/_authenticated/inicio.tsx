import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchFollowingIds, fetchPosts } from "@/lib/feed";
import { PageHeader } from "@/components/app/AppShell";
import { PostCard, PostSkeleton } from "@/components/app/PostCard";
import { Composer } from "@/components/app/Composer";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Pulso" }, { name: "description", content: "Feed da comunidade Pulso." }, { property: "og:title", content: "Início — Pulso" }, { property: "og:description", content: "Feed da comunidade Pulso." }] }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"todos" | "seguindo">("todos");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", "feed", tab, user?.id],
    queryFn: async () => {
      if (tab === "seguindo") {
        const ids = await fetchFollowingIds(user!.id);
        return fetchPosts({ userIds: [...ids, user!.id] });
      }
      return fetchPosts();
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Início" description="O que a comunidade está treinando." />
      <Composer />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList><TabsTrigger value="todos">Comunidade</TabsTrigger><TabsTrigger value="seguindo">Seguindo</TabsTrigger></TabsList>
      </Tabs>
      <div className="mt-4 space-y-4">
        {isLoading ? <><PostSkeleton /><PostSkeleton /></> : isError ? (
          <div className="rounded-xl border border-destructive/40 p-4 text-sm">Não foi possível carregar o feed. <Button variant="link" onClick={() => refetch()}>Tentar de novo</Button></div>
        ) : data && data.length === 0 ? (
          <EmptyState icon={Users} title={tab === "seguindo" ? "Nada por aqui ainda" : "O feed está vazio"} description={tab === "seguindo" ? "Siga atletas em Explorar para ver as atividades deles." : "Seja o primeiro a compartilhar um treino!"} action={<Button asChild variant="hero"><Link to={tab === "seguindo" ? "/explorar" : "/registrar"}>{tab === "seguindo" ? "Explorar atletas" : "Registrar atividade"}</Link></Button>} />
        ) : data?.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}
