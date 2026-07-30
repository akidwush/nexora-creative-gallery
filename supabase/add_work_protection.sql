-- NEXORA CREATIVE GALLERY V4.1
-- Jalankan satu kali di Supabase SQL Editor sebelum deploy patch.

alter table public.gallery_works
  add column if not exists is_protected boolean not null default false;

comment on column public.gallery_works.is_protected is
  'Jika true, antarmuka publik memblokir unduhan biasa, long-press, drag, dan copy gambar serta menampilkan watermark.';
