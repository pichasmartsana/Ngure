-- ============================================================
--  Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run
--  Before running, change the admin email on the line marked  <<<  CHANGE
-- ============================================================

-- 1) The page content (one row, id = 'main')
create table if not exists public.site_content (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

-- 2) Who is allowed to edit
create table if not exists public.site_admins (email text primary key);
alter table public.site_admins enable row level security;   -- no policies = nobody can read it from the browser

insert into public.site_admins (email) values ('ryanngure@gmail.com')   -- <<< CHANGE to the admin's login email
on conflict do nothing;
-- To allow another person later:  insert into public.site_admins (email) values ('someone@example.com');

create or replace function public.is_site_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.site_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

-- 3) Rules for the content table: everyone can read, only admins can write
drop policy if exists "read content"   on public.site_content;
drop policy if exists "admin insert"   on public.site_content;
drop policy if exists "admin update"   on public.site_content;
create policy "read content" on public.site_content for select using (true);
create policy "admin insert" on public.site_content for insert to authenticated with check (public.is_site_admin());
create policy "admin update" on public.site_content for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

-- 4) Storage for photos and videos (public to view, admin-only to change)
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)            -- 50 MB per file (the free plan maximum)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "admin upload media" on storage.objects;
drop policy if exists "admin edit media"   on storage.objects;
drop policy if exists "admin delete media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_site_admin());
create policy "admin edit media"   on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_site_admin());
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_site_admin());
