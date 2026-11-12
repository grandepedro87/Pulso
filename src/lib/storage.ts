import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Use uma imagem JPG, PNG, WEBP ou GIF.";
  if (file.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 5 MB.";
  return null;
}

/** Uploads to the private media bucket under the user's folder and returns the storage path. */
export async function uploadImage(userId: string, file: File, folder = "posts"): Promise<string> {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Não foi possível enviar a imagem.");
  return path;
}

/** Resolves a stored media path (or an external https URL) to a displayable URL. */
export function useMediaUrl(path: string | null | undefined) {
  const isExternal = !!path && /^https?:\/\//.test(path);
  const q = useQuery({
    queryKey: ["media-url", path],
    enabled: !!path && !isExternal,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  if (!path) return undefined;
  return isExternal ? path : q.data;
}
