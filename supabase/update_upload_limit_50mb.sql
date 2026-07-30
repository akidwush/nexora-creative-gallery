-- Nexora Creative Gallery
-- Naikkan batas file Supabase Storage menjadi 50 MB.
-- Jalankan sekali di Supabase SQL Editor.

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]
where id = 'gallery-works';

-- Pastikan bucket tetap publik jika konfigurasi lama berubah.
update storage.buckets
set public = true
where id = 'gallery-works';
