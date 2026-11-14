import { supabase } from "@/integrations/supabase/client";

export interface FeedAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface FeedActivity {
  id: string;
  title: string;
  sport: string;
  duration_minutes: number;
  distance_km: number | null;
  sets: number | null;
  reps: number | null;
  activity_date: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  sport: string;
  created_at: string;
  author: FeedAuthor | null;
  activity: FeedActivity | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
}

export const POST_SELECT = `id, user_id, content, image_url, sport, created_at,
  author:profiles(id, display_name, avatar_url),
  activity:activities(id, title, sport, duration_minutes, distance_km, sets, reps, activity_date),
  likes(user_id),
  comments(count)`;

export interface FeedFilter {
  sport?: string | undefined;
  userIds?: string[];
  userId?: string;
  limit?: number;
}

export async function fetchPosts(filter: FeedFilter = {}): Promise<FeedPost[]> {
  let q = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 50);
  if (filter.sport) q = q.eq("sport", filter.sport);
  if (filter.userId) q = q.eq("user_id", filter.userId);
  if (filter.userIds) q = q.in("user_id", filter.userIds);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FeedPost[];
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.following_id);
}
