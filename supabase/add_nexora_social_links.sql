-- NEXORA CREATIVE GALLERY — DYNAMIC SOCIAL LINKS
-- Jalankan sekali melalui Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang dan tidak mengubah data karya yang sudah ada.

begin;

create extension if not exists pgcrypto;

create table if not exists public.nexora_social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'other',
  label text not null,
  url text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint nexora_social_links_platform_format
    check (platform ~ '^[a-z0-9-]{1,32}$'),
  constraint nexora_social_links_label_length
    check (char_length(label) between 2 and 50),
  constraint nexora_social_links_url_length
    check (char_length(url) between 10 and 2048),
  constraint nexora_social_links_url_format
    check (url ~* '^https?://[^[:space:]]+$'),
  constraint nexora_social_links_sort_order_range
    check (sort_order between 0 and 100000)
);

create index if not exists nexora_social_links_public_order_idx
  on public.nexora_social_links (is_active, sort_order, created_at);

drop trigger if exists nexora_social_links_set_updated_at
  on public.nexora_social_links;
create trigger nexora_social_links_set_updated_at
before update on public.nexora_social_links
for each row execute function public.set_gallery_updated_at();

alter table public.nexora_social_links enable row level security;

drop policy if exists "nexora social links public or staff read"
  on public.nexora_social_links;
create policy "nexora social links public or staff read"
on public.nexora_social_links
for select
to anon, authenticated
using (is_active or public.is_gallery_staff());

drop policy if exists "nexora social links staff insert"
  on public.nexora_social_links;
create policy "nexora social links staff insert"
on public.nexora_social_links
for insert
to authenticated
with check (public.is_gallery_staff());

drop policy if exists "nexora social links staff update"
  on public.nexora_social_links;
create policy "nexora social links staff update"
on public.nexora_social_links
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "nexora social links staff delete"
  on public.nexora_social_links;
create policy "nexora social links staff delete"
on public.nexora_social_links
for delete
to authenticated
using (public.is_gallery_staff());

grant select on public.nexora_social_links to anon, authenticated;
grant insert, update, delete on public.nexora_social_links to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'nexora_social_links'
  ) then
    alter publication supabase_realtime
      add table public.nexora_social_links;
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
