import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart, Loader2, MessageCircle, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/auth";
import type { FeedPost } from "@/lib/feed";
import { friendlyError } from "@/lib/errors";
import { useMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "./UserAvatar";
import { SportBadge } from "./SportBadge";
import { ActivityStats } from "./ActivityStats";

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function PostCard({ post }: { post: FeedPost }) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const imageUrl = useMediaUrl(post.image_url);

  const initiallyLiked = !!user && post.likes.some((l) => l.user_id === user.id);
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [commentCount, setCommentCount] = useState(post.comments[0]?.count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const canDelete = !!user && (user.id === post.user_id || isAdmin);

  async function toggleLike() {
    if (!user || likeBusy) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    setLikeBusy(true);
    const { error } = next
      ? await supabase.from("likes").insert({ post_id: post.id, user_id: user.id })
      : await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    setLikeBusy(false);
    if (error) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast.error("Não foi possível registrar a curtida.");
    }
  }

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Publicação excluída.");
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const author = post.author;

  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <header className="flex items-center gap-3 p-4">
        <Link to="/perfil/$userId" params={{ userId: post.user_id }} className="shrink-0">
          <UserAvatar name={author?.display_name} path={author?.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/perfil/$userId"
            params={{ userId: post.user_id }}
            className="block truncate font-semibold hover:text-primary"
          >
            {author?.display_name ?? "Atleta"}
          </Link>
          <time dateTime={post.created_at} className="text-xs text-muted-foreground">
            {timeAgo(post.created_at)}
          </time>
        </div>
        <SportBadge sport={post.sport} className="hidden sm:inline-flex" />
        {canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Excluir publicação
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div className="space-y-3 px-4 pb-3">
        <SportBadge sport={post.sport} className="sm:hidden" />
        {post.activity ? (
          <h3 className="font-display text-base font-semibold">{post.activity.title}</h3>
        ) : null}
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{post.content}</p>
        {post.activity ? (
          <ActivityStats
            duration={post.activity.duration_minutes}
            distance={post.activity.distance_km}
            sets={post.activity.sets}
            reps={post.activity.reps}
          />
        ) : null}
      </div>

      {post.image_url ? (
        <div className="bg-surface">
          {imageUrl ? (
            <img src={imageUrl} alt="Foto da atividade" loading="lazy" className="max-h-[520px] w-full object-cover" />
          ) : (
            <div className="aspect-video w-full animate-pulse bg-surface-2" />
          )}
        </div>
      ) : null}

      <footer className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          aria-pressed={liked}
          className={cn("gap-1.5", liked && "text-primary hover:text-primary")}
        >
          <Heart className={cn("transition-transform", liked && "scale-110 fill-current")} />
          {likeCount > 0 ? likeCount : null}
          <span className="sr-only sm:not-sr-only">{liked ? "Curtido" : "Curtir"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className="gap-1.5"
        >
          <MessageCircle />
          {commentCount > 0 ? commentCount : null}
          <span className="sr-only sm:not-sr-only">Comentar</span>
        </Button>
      </footer>

      {showComments ? (
        <Comments postId={post.id} postOwnerId={post.user_id} onCountChange={setCommentCount} />
      ) : null}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela sairá do feed junto com curtidas e comentários. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { id: string; display_name: string; avatar_url: string | null } | null;
}

function Comments({
  postId,
  postOwnerId,
  onCountChange,
}: {
  postId: string;
  postOwnerId: string;
  onCountChange: (n: number) => void;
}) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const key = ["comments", postId];

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, author:profiles(id, display_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as CommentRow[];
      onCountChange(rows.length);
      return rows;
    },
  });

  const add = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(friendlyError(e, "Não foi possível comentar.")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e) => toast.error(friendlyError(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (t.length > 500) return void toast.error("Comentário com no máximo 500 caracteres.");
    add.mutate(t);
  }

  return (
    <div className="space-y-3 border-t border-border bg-surface/30 p-4">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando comentários…
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os comentários.</p>
      ) : data && data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="space-y-3">
          {data?.map((c) => {
            const canRemove = user && (c.user_id === user.id || postOwnerId === user.id || isAdmin);
            return (
              <li key={c.id} className="group flex gap-2.5">
                <UserAvatar name={c.author?.display_name} path={c.author?.avatar_url} className="size-8" />
                <div className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to="/perfil/$userId"
                      params={{ userId: c.user_id }}
                      className="truncate text-sm font-semibold hover:text-primary"
                    >
                      {c.author?.display_name ?? "Atleta"}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                    {canRemove ? (
                      <button
                        onClick={() => remove.mutate(c.id)}
                        className="ml-auto text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive focus:opacity-100"
                        aria-label="Excluir comentário"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-line text-sm text-foreground/90">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário…"
          rows={1}
          maxLength={500}
          className="min-h-10 resize-none bg-card"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || add.isPending} aria-label="Enviar comentário">
          {add.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-full bg-surface-2" />
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
    </div>
  );
}
