-- NEXORA CREATIVE GALLERY — TOTAL FIX
-- Jalankan seluruh file ini melalui Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang. Semua perubahan dibungkus dalam satu transaksi.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profil dan otorisasi
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists role text default 'user',
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

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

-- ---------------------------------------------------------------------------
-- Tabel galeri
-- ---------------------------------------------------------------------------

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint gallery_categories_name_length
    check (char_length(name) between 2 and 60)
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
  constraint gallery_creators_name_length
    check (char_length(name) between 2 and 100),
  constraint gallery_creators_whatsapp_format
    check (whatsapp is null or whatsapp ~ '^[0-9]{8,16}$')
);

create index if not exists gallery_creators_name_lower_search_idx
  on public.gallery_creators (lower(name));

create table if not exists public.gallery_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  category_id uuid references public.gallery_categories(id) on delete restrict,
  creator_name text not null,
  creator_id uuid references public.gallery_creators(id) on delete restrict,
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
  constraint gallery_works_title_length
    check (char_length(title) between 2 and 120),
  constraint gallery_works_description_length
    check (char_length(description) between 5 and 1000),
  constraint gallery_works_category_length
    check (char_length(category) between 2 and 60),
  constraint gallery_works_creator_name_length
    check (char_length(creator_name) between 2 and 100),
  constraint gallery_works_year_range check (year between 1900 and 2200),
  constraint gallery_works_whatsapp_format
    check (
      creator_whatsapp is null
      or creator_whatsapp ~ '^[0-9]{8,16}$'
    )
);

alter table public.gallery_works
  add column if not exists category_id uuid,
  add column if not exists creator_id uuid,
  add column if not exists is_protected boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gallery_works_category_id_fkey'
      and conrelid = 'public.gallery_works'::regclass
  ) then
    alter table public.gallery_works
      add constraint gallery_works_category_id_fkey
      foreign key (category_id)
      references public.gallery_categories(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gallery_works_creator_id_fkey'
      and conrelid = 'public.gallery_works'::regclass
  ) then
    alter table public.gallery_works
      add constraint gallery_works_creator_id_fkey
      foreign key (creator_id)
      references public.gallery_creators(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists gallery_works_public_order_idx
  on public.gallery_works (is_published, is_featured desc, created_at desc);

create index if not exists gallery_works_category_idx
  on public.gallery_works (category);

create index if not exists gallery_works_category_id_idx
  on public.gallery_works (category_id);

create index if not exists gallery_works_creator_idx
  on public.gallery_works (creator_name);

create index if not exists gallery_works_creator_id_idx
  on public.gallery_works (creator_id);

drop trigger if exists profiles_set_gallery_updated_at on public.profiles;
create trigger profiles_set_gallery_updated_at
before update on public.profiles
for each row execute function public.set_gallery_updated_at();

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

update public.gallery_works as work
set category_id = category.id
from public.gallery_categories as category
where work.category_id is null
  and lower(work.category) = lower(category.name);

update public.gallery_works as work
set creator_id = creator.id
from public.gallery_creators as creator
where work.creator_id is null
  and lower(work.creator_name) = lower(creator.name);

-- Bila data lama memiliki beberapa unggulan, pertahankan karya terbaru saja.
with featured_rank as (
  select
    id,
    row_number() over (order by updated_at desc, created_at desc, id) as position
  from public.gallery_works
  where is_featured
)
update public.gallery_works as work
set is_featured = false
from featured_rank
where work.id = featured_rank.id
  and featured_rank.position > 1;

create unique index if not exists gallery_works_single_featured_idx
  on public.gallery_works ((is_featured))
  where is_featured;

-- ---------------------------------------------------------------------------
-- Transaksi penyimpanan karya
-- ---------------------------------------------------------------------------

create or replace function public.save_gallery_work(
  p_work_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_creator_name text,
  p_creator_slug text,
  p_creator_whatsapp text,
  p_creator_instagram_url text,
  p_creator_portfolio_url text,
  p_image_url text,
  p_image_path text,
  p_year integer,
  p_is_featured boolean,
  p_is_published boolean,
  p_is_protected boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_category_name text;
  v_creator_id uuid;
  v_creator_name text := trim(p_creator_name);
  v_creator_slug text;
  v_saved_work_id uuid;
begin
  if auth.uid() is null or not public.is_gallery_staff() then
    raise exception 'Akun tidak memiliki akses pengelolaan galeri.'
      using errcode = '42501';
  end if;

  select category.id, category.name
  into v_category_id, v_category_name
  from public.gallery_categories as category
  where lower(category.name) = lower(trim(p_category))
  limit 1;

  if v_category_id is null then
    raise exception 'Kategori "%" tidak tersedia.', p_category
      using errcode = '23514';
  end if;

  select creator.id, creator.slug
  into v_creator_id, v_creator_slug
  from public.gallery_creators as creator
  where lower(creator.name) = lower(v_creator_name)
  limit 1;

  if v_creator_id is null then
    v_creator_slug := coalesce(
      nullif(trim(p_creator_slug), ''),
      'creator-' || substr(md5(lower(v_creator_name)), 1, 16)
    );

    if exists (
      select 1
      from public.gallery_creators
      where slug = v_creator_slug
    ) then
      v_creator_slug :=
        left(v_creator_slug, 62)
        || '-'
        || substr(md5(v_creator_name), 1, 12);
    end if;

    insert into public.gallery_creators (
      name,
      slug,
      whatsapp,
      instagram_url,
      portfolio_url
    )
    values (
      v_creator_name,
      v_creator_slug,
      nullif(trim(coalesce(p_creator_whatsapp, '')), ''),
      nullif(trim(coalesce(p_creator_instagram_url, '')), ''),
      nullif(trim(coalesce(p_creator_portfolio_url, '')), '')
    )
    returning id into v_creator_id;
  else
    update public.gallery_creators
    set whatsapp = nullif(trim(coalesce(p_creator_whatsapp, '')), ''),
        instagram_url =
          nullif(trim(coalesce(p_creator_instagram_url, '')), ''),
        portfolio_url =
          nullif(trim(coalesce(p_creator_portfolio_url, '')), '')
    where id = v_creator_id;
  end if;

  if coalesce(p_is_featured, false) then
    update public.gallery_works
    set is_featured = false
    where is_featured
      and (p_work_id is null or id <> p_work_id);
  end if;

  if p_work_id is null then
    insert into public.gallery_works (
      title,
      description,
      category,
      category_id,
      creator_name,
      creator_id,
      creator_whatsapp,
      creator_instagram_url,
      creator_portfolio_url,
      image_url,
      image_path,
      year,
      is_featured,
      is_published,
      is_protected,
      created_by
    )
    values (
      trim(p_title),
      trim(p_description),
      v_category_name,
      v_category_id,
      v_creator_name,
      v_creator_id,
      nullif(trim(coalesce(p_creator_whatsapp, '')), ''),
      nullif(trim(coalesce(p_creator_instagram_url, '')), ''),
      nullif(trim(coalesce(p_creator_portfolio_url, '')), ''),
      trim(p_image_url),
      trim(p_image_path),
      p_year,
      coalesce(p_is_featured, false),
      coalesce(p_is_published, true),
      coalesce(p_is_protected, false),
      auth.uid()
    )
    returning id into v_saved_work_id;
  else
    update public.gallery_works
    set title = trim(p_title),
        description = trim(p_description),
        category = v_category_name,
        category_id = v_category_id,
        creator_name = v_creator_name,
        creator_id = v_creator_id,
        creator_whatsapp =
          nullif(trim(coalesce(p_creator_whatsapp, '')), ''),
        creator_instagram_url =
          nullif(trim(coalesce(p_creator_instagram_url, '')), ''),
        creator_portfolio_url =
          nullif(trim(coalesce(p_creator_portfolio_url, '')), ''),
        image_url = trim(p_image_url),
        image_path = trim(p_image_path),
        year = p_year,
        is_featured = coalesce(p_is_featured, false),
        is_published = coalesce(p_is_published, true),
        is_protected = coalesce(p_is_protected, false)
    where id = p_work_id
    returning id into v_saved_work_id;

    if v_saved_work_id is null then
      raise exception 'Karya yang akan diedit tidak ditemukan.'
        using errcode = 'P0002';
    end if;
  end if;

  return v_saved_work_id;
end;
$$;

revoke all on function public.save_gallery_work(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  boolean,
  boolean,
  boolean
) from public, anon;

grant execute on function public.save_gallery_work(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  boolean,
  boolean,
  boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_creators enable row level security;
alter table public.gallery_works enable row level security;

drop policy if exists "gallery profile own read" on public.profiles;
create policy "gallery profile own read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "gallery categories public read"
  on public.gallery_categories;
create policy "gallery categories public read"
on public.gallery_categories
for select
using (true);

drop policy if exists "gallery categories staff insert"
  on public.gallery_categories;
create policy "gallery categories staff insert"
on public.gallery_categories
for insert
to authenticated
with check (public.is_gallery_staff());

drop policy if exists "gallery categories staff update"
  on public.gallery_categories;
create policy "gallery categories staff update"
on public.gallery_categories
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "gallery categories staff delete"
  on public.gallery_categories;
create policy "gallery categories staff delete"
on public.gallery_categories
for delete
to authenticated
using (public.is_gallery_staff());

drop policy if exists "gallery creators public read"
  on public.gallery_creators;
drop policy if exists "gallery creators staff read"
  on public.gallery_creators;
create policy "gallery creators staff read"
on public.gallery_creators
for select
to authenticated
using (public.is_gallery_staff());

drop policy if exists "gallery creators staff insert"
  on public.gallery_creators;
create policy "gallery creators staff insert"
on public.gallery_creators
for insert
to authenticated
with check (public.is_gallery_staff());

drop policy if exists "gallery creators staff update"
  on public.gallery_creators;
create policy "gallery creators staff update"
on public.gallery_creators
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "gallery creators staff delete"
  on public.gallery_creators;
create policy "gallery creators staff delete"
on public.gallery_creators
for delete
to authenticated
using (public.is_gallery_staff());

drop policy if exists "gallery works public or staff read"
  on public.gallery_works;
create policy "gallery works public or staff read"
on public.gallery_works
for select
using (is_published or public.is_gallery_staff());

drop policy if exists "gallery works staff insert"
  on public.gallery_works;
create policy "gallery works staff insert"
on public.gallery_works
for insert
to authenticated
with check (
  public.is_gallery_staff()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "gallery works staff update"
  on public.gallery_works;
create policy "gallery works staff update"
on public.gallery_works
for update
to authenticated
using (public.is_gallery_staff())
with check (public.is_gallery_staff());

drop policy if exists "gallery works staff delete"
  on public.gallery_works;
create policy "gallery works staff delete"
on public.gallery_works
for delete
to authenticated
using (public.is_gallery_staff());

grant select on public.profiles to authenticated;
grant select on public.gallery_categories to anon, authenticated;
grant select on public.gallery_creators to authenticated;
revoke select on public.gallery_creators from anon;
grant select on public.gallery_works to anon, authenticated;
grant insert, update, delete on public.gallery_categories to authenticated;
grant insert, update, delete on public.gallery_creators to authenticated;
grant insert, update, delete on public.gallery_works to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

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
  52428800,
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

-- Aktifkan event realtime bila publication standar Supabase tersedia.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'gallery_works'
    ) then
      alter publication supabase_realtime
        add table public.gallery_works;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'gallery_categories'
    ) then
      alter publication supabase_realtime
        add table public.gallery_categories;
    end if;
  end if;
end
$$;

commit;
