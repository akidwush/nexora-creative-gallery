-- NEXORA CREATIVE GALLERY
-- Jalankan seluruh file ini satu kali melalui Supabase Dashboard > SQL Editor.
-- Script aman dijalankan ulang karena memakai IF NOT EXISTS dan DROP POLICY IF EXISTS.

create extension if not exists pgcrypto;

create or replace function public.is_gallery_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role::text in ('admin', 'editor')
  );
$$;

grant execute on function public.is_gallery_staff() to anon, authenticated;

create or replace function public.set_gallery_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint gallery_categories_name_length check (char_length(name) between 2 and 60)
);

create unique index if not exists gallery_categories_name_lower_idx
  on public.gallery_categories (lower(name));

create table if not exists public.gallery_creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  whatsapp text,
  instagram_url text,
  portfolio_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gallery_creators_name_length check (char_length(name) between 2 and 100),
  constraint gallery_creators_whatsapp_format check (
    whatsapp is null or whatsapp ~ '^[0-9]{8,16}$'
  )
);

create table if not exists public.gallery_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  creator_name text not null,
  creator_whatsapp text,
  creator_instagram_url text,
  creator_portfolio_url text,
  image_url text not null,
  image_path text not null unique,
  year integer not null default extract(year from current_date)::integer,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  is_protected boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gallery_works_title_length check (char_length(title) between 2 and 120),
  constraint gallery_works_description_length check (char_length(description) between 5 and 1000),
  constraint gallery_works_category_length check (char_length(category) between 2 and 60),
  constraint gallery_works_creator_name_length check (char_length(creator_name) between 2 and 100),
  constraint gallery_works_year_range check (year between 1900 and 2200),
  constraint gallery_works_whatsapp_format check (
    creator_whatsapp is null or creator_whatsapp ~ '^[0-9]{8,16}$'
  )
);

alter table public.gallery_works
  add column if not exists is_protected boolean not null default false;

create index if not exists gallery_works_public_order_idx
  on public.gallery_works (is_published, is_featured desc, created_at desc);

create index if not exists gallery_works_category_idx
  on public.gallery_works (category);

create index if not exists gallery_works_creator_idx
  on public.gallery_works (creator_name);

drop trigger if exists gallery_creators_set_updated_at on public.gallery_creators;
create trigger gallery_creators_set_updated_at
before update on public.gallery_creators
for each row execute function public.set_gallery_updated_at();

drop trigger if exists gallery_works_set_updated_at on public.gallery_works;
create trigger gallery_works_set_updated_at
before update on public.gallery_works
for each row execute function public.set_gallery_updated_at();

insert into public.gallery_categories (name, slug, sort_order)
values
  ('Poster', 'poster', 10),
  ('Branding', 'branding', 20),
  ('Illustration', 'illustration', 30),
  ('Motion', 'motion', 40),
  ('UI/UX', 'ui-ux', 50),
  ('Lainnya', 'lainnya', 60)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

alter table public.gallery_categories enable row level security;
alter table public.gallery_creators enable row level security;
alter table public.gallery_works enable row level security;

drop policy if exists "gallery categories public read" on public.gallery_categories;
create policy "gallery categories public read"
on public.gallery_categories
for select
using (true);

drop policy if exists "gallery categories staff insert" on public.gallery_categories;
create policy "gallery categories staff insert"
on public.gallery_categories
for insert
to authenticated
with check (public.is_gallery_staff());

drop policy if exists "gallery categories staff update" on public.gallery_categories;
create policy "gallery categories staff update"
on public.gallery_categories
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "gallery categories staff delete" on public.gallery_categories;
create policy "gallery categories staff delete"
on public.gallery_categories
for delete
to authenticated
using (public.is_gallery_staff());

drop policy if exists "gallery creators public read" on public.gallery_creators;
create policy "gallery creators public read"
on public.gallery_creators
for select
using (true);

drop policy if exists "gallery creators staff insert" on public.gallery_creators;
create policy "gallery creators staff insert"
on public.gallery_creators
for insert
to authenticated
with check (public.is_gallery_staff());

drop policy if exists "gallery creators staff update" on public.gallery_creators;
create policy "gallery creators staff update"
on public.gallery_creators
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "gallery creators staff delete" on public.gallery_creators;
create policy "gallery creators staff delete"
on public.gallery_creators
for delete
to authenticated
using (public.is_gallery_staff());

drop policy if exists "gallery works public or staff read" on public.gallery_works;
create policy "gallery works public or staff read"
on public.gallery_works
for select
using (is_published or public.is_gallery_staff());

drop policy if exists "gallery works staff insert" on public.gallery_works;
create policy "gallery works staff insert"
on public.gallery_works
for insert
to authenticated
with check (
  public.is_gallery_staff()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "gallery works staff update" on public.gallery_works;
create policy "gallery works staff update"
on public.gallery_works
for update
to authenticated
using (public.is_gallery_staff())
with check (
  public.is_gallery_staff()
  and (created_by is null or created_by = auth.uid() or public.is_gallery_staff())
);

drop policy if exists "gallery works staff delete" on public.gallery_works;
create policy "gallery works staff delete"
on public.gallery_works
for delete
to authenticated
using (public.is_gallery_staff());

grant select on public.gallery_categories to anon, authenticated;
grant select on public.gallery_creators to anon, authenticated;
grant select on public.gallery_works to anon, authenticated;
grant insert, update, delete on public.gallery_categories to authenticated;
grant insert, update, delete on public.gallery_creators to authenticated;
grant insert, update, delete on public.gallery_works to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gallery-works',
  'gallery-works',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery storage public read" on storage.objects;
create policy "gallery storage public read"
on storage.objects
for select
using (bucket_id = 'gallery-works');

drop policy if exists "gallery storage staff upload" on storage.objects;
create policy "gallery storage staff upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery-works'
  and public.is_gallery_staff()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "gallery storage staff update" on storage.objects;
create policy "gallery storage staff update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery-works'
  and public.is_gallery_staff()
)
with check (
  bucket_id = 'gallery-works'
  and public.is_gallery_staff()
);

drop policy if exists "gallery storage staff delete" on storage.objects;
create policy "gallery storage staff delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery-works'
  and public.is_gallery_staff()
);
