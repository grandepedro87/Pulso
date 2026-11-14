import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/lib/auth";
import { SPORT_LIST, type SportId } from "@/lib/sports";
import { uploadImage } from "@/lib/storage";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "./UserAvatar";
import { ImageInput } from "./ImageInput";

export function Composer() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sport, setSport] = useState<SportId>("outros");
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t) { toast.error("Escreva algo para publicar."); return; }
    if (t.length > 1000) { toast.error("Máximo de 1000 caracteres."); return; }
    setBusy(true);
    try {
      const image_url = file ? await uploadImage(user!.id, file) : null;
      const { error } = await supabase.from("posts").insert({ user_id: user!.id, content: t, sport, image_url });
      if (error) throw error;
      toast.success("Publicado!");
      setText(""); setFile(null); setOpen(false);
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível publicar."));
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex gap-3">
        <UserAvatar name={profile?.display_name} path={profile?.avatar_url} />
        <Textarea value={text} onFocus={() => setOpen(true)} onChange={(e) => setText(e.target.value)} placeholder="Como foi o treino hoje?" rows={open ? 3 : 1} maxLength={1000} className="resize-none border-none bg-surface/60" />
      </div>
      {open ? (
        <div className="mt-3 space-y-3 pl-13">
          <ImageInput file={file} onChange={setFile} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Select value={sport} onValueChange={(v) => setSport(v as SportId)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{SPORT_LIST.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setOpen(false); setText(""); setFile(null); }}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}Publicar</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
