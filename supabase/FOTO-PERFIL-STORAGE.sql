-- StudioDesk — fotos de perfil no Supabase Storage
-- Os arquivos NÃO são gravados em tabelas do banco de dados.
-- Seguro para executar mais de uma vez.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studiodesk-avatars',
  'studiodesk-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  drop policy if exists "studiodesk_avatar_select_own" on storage.objects;
  create policy "studiodesk_avatar_select_own"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'studiodesk-avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists "studiodesk_avatar_insert_own" on storage.objects;
  create policy "studiodesk_avatar_insert_own"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'studiodesk-avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists "studiodesk_avatar_update_own" on storage.objects;
  create policy "studiodesk_avatar_update_own"
    on storage.objects for update to authenticated
    using (
      bucket_id = 'studiodesk-avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'studiodesk-avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists "studiodesk_avatar_delete_own" on storage.objects;
  create policy "studiodesk_avatar_delete_own"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'studiodesk-avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
end $$;

commit;
