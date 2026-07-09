-- P2: Storage 버킷(강사/Work/Insights 이미지) + RLS
-- 근거: docs/어드민기획.md §8 (Storage: experts/work/insights, 읽기 public, 쓰기 admin).

-- 공개 읽기 버킷 3개 (5MB 제한, 이미지 MIME만).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('experts',  'experts',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('work',     'work',     true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('insights', 'insights', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects 는 Supabase가 이미 RLS ON. 콘텐츠 버킷에 정책만 추가.
-- 읽기: 누구나(공개 버킷). 쓰기/수정/삭제: is_admin() 만.
drop policy if exists content_images_public_read on storage.objects;
create policy content_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('experts','work','insights'));

drop policy if exists content_images_admin_insert on storage.objects;
create policy content_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('experts','work','insights') and public.is_admin());

drop policy if exists content_images_admin_update on storage.objects;
create policy content_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id in ('experts','work','insights') and public.is_admin())
  with check (bucket_id in ('experts','work','insights') and public.is_admin());

drop policy if exists content_images_admin_delete on storage.objects;
create policy content_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('experts','work','insights') and public.is_admin());
