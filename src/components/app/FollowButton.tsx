import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";

export function FollowButton({ targetId, size = "sm" }: { targetId: string; size?: "sm" | "default" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: following, isLoading } = useQuery({
    queryKey: ["is-following", user?.id, targetId],
    enabled: !!user && user.id !== targetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user!.id)
          .eq("following_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user!.id, following_id: targetId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      qc.invalidateQueries({ queryKey: ["following-ids"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  if (!user || user.id === targetId) return null;
  return (
    <Button
      size={size}
      variant={following ? "glass" : "default"}
      disabled={isLoading || mut.isPending}
      onClick={() => mut.mutate()}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
