create policy "Signed-in users can view media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media');

create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);